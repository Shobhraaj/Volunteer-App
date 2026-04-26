const functions = require('firebase-functions');
const axios = require('axios');

/**
 * Cloud Function: onTaskCreated
 * Triggers when a new task document is created in Firestore.
 * Automatically calls the backend's auto-assign endpoint.
 */
exports.onTaskCreated = functions.firestore
    .document('tasks/{taskId}')
    .onCreate(async (snapshot, context) => {
        const taskId = context.params.taskId;
        const taskData = snapshot.data();

        console.log(`[AutoAssign] New task detected: ${taskId}`);

        // Only auto-assign if it's marked for it or just by default
        try {
            // Replace with your actual backend URL
            const backendUrl = functions.config().api.url || 'https://your-api-url.com/api';
            const response = await axios.post(`${backendUrl}/tasks/${taskId}/auto-assign`);
            
            console.log(`[AutoAssign] Success: ${response.data.assigned_count} volunteers assigned.`);
        } catch (error) {
            console.error(`[AutoAssign] Failed to trigger auto-assignment:`, error.message);
        }
    });
