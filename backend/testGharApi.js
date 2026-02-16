const axios = require('axios');
require('dotenv').config({ path: '.env' });

async function getSampleData() {
    const baseURL = 'https://ghar.navgurukul.org';
    const token = process.env.NAVGURUKUL_API_TOKEN;

    // Handle the double token issue if present
    const cleanToken = token.split('eyJhbGci').find(t => t.length > 0) ? 'eyJhbGci' + token.split('eyJhbGci').pop() : token;

    const client = axios.create({
        baseURL,
        headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Accept': 'application/json'
        }
    });

    console.log('--- Testing Ghar Dashboard (Zoho) API Endpoints ---\n');

    // 1. Attendance Config (We know this works)
    try {
        const res = await client.get('/gharZoho/All_Attendance_Configurations?isDev=true');
        console.log('✅ [Attendance Config]: Success');
    } catch (e) {
        console.log('❌ [Attendance Config]: Failed', e.message);
    }

    // 2. Student by Email (New Endpoint)
    const testEmail = 'ankush25@navgurukul.org';
    try {
        console.log(`\n--- Fetching data for: ${testEmail} ---`);
        const res = await client.get('/gharZoho/students/By/NgEmail', {
            params: {
                isDev: true,
                Student_ng_email: testEmail
            }
        });
        console.log('✅ [Student Data]: Success');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log('❌ [Student Data]: Failed', e.message);
        if (e.response) console.log('Response:', e.response.data);
    }

    console.log('\n--- End of Sample Test ---');
}

getSampleData();
