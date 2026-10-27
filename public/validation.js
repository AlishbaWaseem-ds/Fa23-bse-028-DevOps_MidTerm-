// Shared validation: works in the browser (window.Validation) and Node (require).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Validation = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function isValidUrl(value) {
    try {
      const u = new URL(String(value).trim());
      return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
    } catch (e) {
      return false;
    }
  }

  // Returns { valid, errors: {field: message}, clean }
  function validateSubmission(input) {
    const data = input || {};
    const clean = {
      name: String(data.name || '').trim(),
      regNo: String(data.regNo || '').trim(),
      title: String(data.title || '').trim(),
      url: String(data.url || '').trim(),
    };
    const errors = {};
    if (!clean.name) errors.name = 'Name is required.';
    //if (!clean.regNo) errors.regNo = 'Registration number is required.';
    if (!clean.title) errors.title = 'Assignment title is required.';
    if (!clean.url) errors.url = 'Submission URL is required.';
    else if (!isValidUrl(clean.url)) errors.url = 'Enter a valid http(s) URL.';
    return { valid: Object.keys(errors).length === 0, errors, clean };
  }

  return { validateSubmission, isValidUrl };
});
