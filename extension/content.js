function extractCompanyName() {
  const linkedInCompanyEl = document.querySelector(
    '.job-details-jobs-unified-top-card__company-name'
  )
  if (linkedInCompanyEl) {
    const anchor = linkedInCompanyEl.querySelector('a')
    const text = (anchor || linkedInCompanyEl).innerText?.trim()
    if (text) return text
  }

  const ogSiteName = document
    .querySelector('meta[property="og:site_name"]')
    ?.getAttribute('content')
    ?.trim()
  if (ogSiteName) return ogSiteName

  try {
    return new URL(window.location.href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function extractJobTitle() {
  const linkedInTitleEl = document.querySelector(
    'h1.job-details-jobs-unified-top-card__job-title'
  )
  if (linkedInTitleEl?.innerText?.trim()) {
    return linkedInTitleEl.innerText.trim()
  }

  return document.querySelector('h1')?.innerText?.trim() || ''
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_JOB') {
    const data = {
      company: extractCompanyName(),
      role: extractJobTitle(),
      salary: '',
      tech_stack: [],
      url: window.location.href,
      raw_html: document.documentElement.innerHTML,
    }
    sendResponse({ success: true, data })
  }
  return true
})
