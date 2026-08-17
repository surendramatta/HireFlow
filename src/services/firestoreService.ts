import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  addDoc, 
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { JobListing, ApplicationRecord, AutoApplyLog, AutoApplyConfig, ApplicationStatus } from "../types";
import { initialAutoApplyConfig } from "../data/mockData";

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  if (typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as any;
  }
  const cleanObj: any = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj;
}

// -------------------------------------------------------------
// REAL-TIME JOBS SERVICE
// -------------------------------------------------------------

export const subscribeToJobs = (onUpdate: (jobs: JobListing[]) => void) => {
  const jobsRef = collection(db, "jobs");
  return onSnapshot(jobsRef, (snapshot) => {
    if (snapshot.empty) {
      onUpdate([]);
      return;
    }
    const jobsList: JobListing[] = [];
    snapshot.forEach((docSnap) => {
      jobsList.push({ id: docSnap.id, ...docSnap.data() } as JobListing);
    });
    onUpdate(jobsList);
  }, (err) => {
    console.error("Error listening to jobs:", err);
    onUpdate([]);
  });
};

export const addCustomJobToDb = async (
  job: Omit<JobListing, "id"> & { id?: string }
): Promise<string> => {
  // Prefer stable board ids (greenhouse-*, lever-*, ashby-*) so refreshes upsert instead of duplicating
  const preferredId =
    job.id && /^(greenhouse|lever|ashby|imported)-/i.test(job.id) ? job.id : undefined;
  const newJobRef = preferredId ? doc(db, "jobs", preferredId) : doc(collection(db, "jobs"));
  const newJob: JobListing = {
    ...job,
    id: newJobRef.id,
    logoUrl: job.logoUrl || "",
    companySize: job.companySize || "Unknown",
    matchingSkills: job.matchingSkills || [],
    missingSkills: job.missingSkills || [],
  };
  await setDoc(newJobRef, sanitizeForFirestore(newJob), { merge: true });
  return newJobRef.id;
};

export const deleteJobFromDb = async (jobId: string) => {
  await deleteDoc(doc(db, "jobs", jobId));
};

// -------------------------------------------------------------
// REAL-TIME APPLICATIONS SERVICE
// -------------------------------------------------------------

export const subscribeToApplications = (
  userId: string | null, 
  onUpdate: (apps: ApplicationRecord[]) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const appsRef = collection(db, "users", userId, "applications");

  return onSnapshot(appsRef, (snapshot) => {
    const appsList: ApplicationRecord[] = [];
    snapshot.forEach((docSnap) => {
      appsList.push({ id: docSnap.id, ...docSnap.data() } as ApplicationRecord);
    });
    onUpdate(appsList);
  }, (err) => {
    console.error("Error listening to applications:", err);
    onUpdate([]);
  });
};

export const saveApplicationToDb = async (
  userId: string, 
  appRecord: ApplicationRecord
) => {
  const appRef = doc(db, "users", userId, "applications", appRecord.id);
  await setDoc(appRef, sanitizeForFirestore(appRecord), { merge: true });
};

export const updateApplicationStatusInDb = async (
  userId: string, 
  appId: string, 
  status: ApplicationStatus, 
  extras?: Partial<ApplicationRecord>
) => {
  const appRef = doc(db, "users", userId, "applications", appId);
  const payload = {
    status,
    lastUpdated: new Date().toISOString().split("T")[0],
    ...extras
  };
  await setDoc(appRef, sanitizeForFirestore(payload), { merge: true });
};

export const deleteApplicationFromDb = async (userId: string, appId: string) => {
  const appRef = doc(db, "users", userId, "applications", appId);
  await deleteDoc(appRef);
};

// -------------------------------------------------------------
// REAL-TIME SAVED JOBS SERVICE
// -------------------------------------------------------------

export const subscribeToSavedJobs = (
  userId: string | null, 
  onUpdate: (savedJobIds: string[]) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const savedRef = collection(db, "users", userId, "saved_jobs");
  return onSnapshot(savedRef, (snapshot) => {
    const ids: string[] = [];
    snapshot.forEach((docSnap) => {
      ids.push(docSnap.id);
    });
    onUpdate(ids);
  }, (err) => {
    console.error("Error listening to saved jobs:", err);
    onUpdate([]);
  });
};

export const toggleSaveJobInDb = async (userId: string, jobId: string, isCurrentlySaved: boolean) => {
  const savedDocRef = doc(db, "users", userId, "saved_jobs", jobId);
  if (isCurrentlySaved) {
    await deleteDoc(savedDocRef);
  } else {
    await setDoc(savedDocRef, { savedAt: new Date().toISOString() });
  }
};

// -------------------------------------------------------------
// REAL-TIME AUTO APPLY LOGS & CONFIG
// -------------------------------------------------------------

export const subscribeToAutoApplyLogs = (
  userId: string | null,
  onUpdate: (logs: AutoApplyLog[]) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const logsRef = collection(db, "users", userId, "auto_apply_logs");
  return onSnapshot(logsRef, (snapshot) => {
    const logs: AutoApplyLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as AutoApplyLog);
    });
    // Sort by timestamp desc
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    onUpdate(logs);
  }, (err) => {
    console.error("Error listening to auto apply logs:", err);
    onUpdate([]);
  });
};

export const addAutoApplyLogToDb = async (userId: string, log: AutoApplyLog) => {
  const logRef = doc(db, "users", userId, "auto_apply_logs", log.id);
  await setDoc(logRef, sanitizeForFirestore(log));
};

export const subscribeToAutoApplyConfig = (
  userId: string | null,
  onUpdate: (config: AutoApplyConfig) => void
) => {
  if (!userId) {
    onUpdate(initialAutoApplyConfig);
    return () => {};
  }

  const configRef = doc(db, "users", userId, "config", "auto_apply");
  return onSnapshot(
    configRef, 
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AutoApplyConfig);
      } else {
        setDoc(configRef, sanitizeForFirestore(initialAutoApplyConfig)).catch((err) =>
          console.warn("Notice setting initial auto apply config:", err.message)
        );
        onUpdate(initialAutoApplyConfig);
      }
    }, 
    (err) => {
      console.warn("Auto apply config snapshot notice:", err.message);
      onUpdate(initialAutoApplyConfig);
    }
  );
};

export const updateAutoApplyConfigInDb = async (userId: string, newConfig: Partial<AutoApplyConfig>) => {
  const configRef = doc(db, "users", userId, "config", "auto_apply");
  await setDoc(configRef, sanitizeForFirestore(newConfig), { merge: true });
};
