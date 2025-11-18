chrome.runtime.onMessage.addListener((msg) => {
  try {
    if (typeof msg.index === "number") {
      // Remove existing [number] prefix
      let title = document.title.replace(/^\[\d+\]\s*/, "");
      if (msg.index > 0) {
        title = `[${msg.index}] ${title}`;
      }
      document.title = title;
    }
  } catch (error) {
    console.error(error);
  }
});
