import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const testUpload = async () => {
  const email = 'abhi@example.com';
  const password = '12345678';
  const baseURL = 'http://localhost:5000/api';

  try {
    console.log('1. Attempting login...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, { email, password });
    const token = loginRes.data.accessToken;
    console.log('Login successful. Token acquired.\n');

    console.log('2. Preparing file upload...');
    const filePath = path.join(process.cwd(), 'test.txt');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'This is a sample study text file about Python.');
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log('3. Sending file upload request to backend...');
    const uploadRes = await axios.post(`${baseURL}/files/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Upload Response Success:');
    console.log(JSON.stringify(uploadRes.data, null, 2));

  } catch (err) {
    console.error('\n❌ UPLOAD TEST FAILED:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error message:', err.message);
    }
  }
};

testUpload();
