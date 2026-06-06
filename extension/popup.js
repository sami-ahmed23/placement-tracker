const INGEST_URL = 'https://placement-tracker-azure-one.vercel.app/api/ingest'

document.getElementById('capture').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const status = document.getElementById('status')

  status.textContent = 'Authenticating...'

  const authRes = await fetch('https://dfugplplaydxegsxtmpm.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmdWdwbHBsYXlkeGVnc3h0bXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTg0NjgsImV4cCI6MjA5MjQzNDQ2OH0.HjMUtmPKY_JrJdu5Owtf2xDuzfwO9tnh5L8Y-nzHeMY'
    },
    body: JSON.stringify({ email, password })
  })

  const authData = await authRes.json()

  if (!authData.access_token) {
    status.textContent = 'Auth failed.'
    return
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'CAPTURE_JOB' }, async (response) => {
      if (!response?.success) {
        status.textContent = 'Capture failed.'
        return
      }

      const ingestRes = await fetch(INGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.access_token}`
        },
        body: JSON.stringify(response.data)
      })

      if (ingestRes.ok) {
        status.textContent = 'Captured.'
      } else {
        status.textContent = 'Ingest failed.'
      }
    })
  })
})