/**
 * Notification Service — bridge between app actions and Firestore notifications.
 * When a user applies/cancels, we push a record to Firestore for the relevant user.
 */
import { db, FIREBASE_CONFIGURED } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const sendNotification = async (userId, { title, body, type }) => {
  if (!FIREBASE_CONFIGURED || !db || !userId) return;

  try {
    const notificationsRef = collection(db, 'notifications', String(userId), 'items');
    await addDoc(notificationsRef, {
      title,
      body,
      type: type || 'info',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending Firestore notification:', error);
  }
};

// Preset notifications
export const notifyTaskApplied = (userId, taskTitle) =>
  sendNotification(userId, {
    title: 'Application Sent',
    body: `You have applied for: ${taskTitle}. The organizer has been notified.`,
    type: 'task',
  });

export const notifyTaskAssigned = (userId, taskTitle) =>
  sendNotification(userId, {
    title: 'Task Assigned! 📌',
    body: `You have been assigned to: ${taskTitle}. Check your dashboard for details.`,
    type: 'approval',
  });

export const notifyTaskCancelled = (userId, taskTitle) =>
  sendNotification(userId, {
    title: 'Task Cancelled ❌',
    body: `Your participation in "${taskTitle}" has been cancelled.`,
    type: 'cancel',
  });
