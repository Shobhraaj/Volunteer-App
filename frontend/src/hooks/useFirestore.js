/**
 * Custom hooks for Firebase Firestore real-time subscriptions.
 * All hooks gracefully degrade when Firebase is not configured.
 */

import { useState, useEffect, useRef } from 'react';
import { db, FIREBASE_CONFIGURED } from '../firebase';
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, getDoc, getDocs,
} from 'firebase/firestore';

/**
 * Subscribe to a Firestore document in real-time.
 * Returns [data, loading, error]
 */
export function useFirestoreDoc(collectionName, docId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const unsubRef              = useRef(null);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !db || !docId) {
      setLoading(false);
      return;
    }
    const ref = doc(db, collectionName, String(docId));
    unsubRef.current = onSnapshot(
      ref,
      (snap) => { setData(snap.exists() ? { id: snap.id, ...snap.data() } : null); setLoading(false); },
      (err)  => { setError(err); setLoading(false); }
    );
    return () => unsubRef.current?.();
  }, [collectionName, docId]);

  return [data, loading, error];
}

/**
 * Subscribe to a Firestore collection in real-time.
 * Returns [items[], loading, error]
 */
export function useFirestoreCollection(collectionName, constraints = []) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const unsubRef              = useRef(null);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, collectionName);
    const q   = constraints.length ? query(ref, ...constraints) : ref;
    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { setError(err); setLoading(false); }
    );
    return () => unsubRef.current?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return [items, loading, error];
}

/**
 * Hook for reading/writing a volunteer's activity status in Firestore.
 * Status: 'active' | 'busy' | 'offline'
 */
export function useActivityStatus(userId) {
  const [status, setStatus]   = useState('offline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !db || !userId) { setLoading(false); return; }
    const ref = doc(db, 'userStatus', String(userId));
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setStatus(snap.data().status || 'offline');
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const updateStatus = async (newStatus) => {
    if (!FIREBASE_CONFIGURED || !db || !userId) {
      setStatus(newStatus); // local-only fallback
      return;
    }
    const ref = doc(db, 'userStatus', String(userId));
    await setDoc(ref, { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
    setStatus(newStatus);
  };

  return [status, loading, updateStatus];
}

/**
 * Hook for fetching notifications for a user.
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !db || !userId) return;
    const ref = collection(db, 'notifications');
    const q   = query(
      ref,
      where('userId', '==', String(userId)),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });
    return () => unsub();
  }, [userId]);

  const markAllRead = async () => {
    if (!FIREBASE_CONFIGURED || !db || !userId) return;
    const ref = collection(db, 'notifications');
    const q   = query(ref, where('userId', '==', String(userId)), where('read', '==', false));
    const snap = await getDocs(q);
    const updates = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
    await Promise.all(updates);
  };

  return [notifications, unreadCount, markAllRead];
}

/**
 * Write a notification to Firestore (called by action handlers).
 */
export async function pushNotification(userId, { title, body, type = 'info' }) {
  if (!FIREBASE_CONFIGURED || !db) return;
  const ref = doc(collection(db, 'notifications'));
  await setDoc(ref, {
    userId: String(userId),
    title,
    body,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// Re-export Firestore helpers for convenience
export { serverTimestamp, orderBy, where, limit };
