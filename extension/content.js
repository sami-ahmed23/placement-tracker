chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_JOB') {
      const data = {
        company: document.title,
        role: document.querySelector('h1')?.innerText || '',
        salary: '',
        tech_stack: [],
        url: window.location.href,
        raw_html: document.documentElement.innerHTML,
      }
      sendResponse({ success: true, data })
    }
    return true
  })