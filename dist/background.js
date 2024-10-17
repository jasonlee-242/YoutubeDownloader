"use strict";
console.log("Feature in Development!")
// Background worker to track tab changes
//In Development


// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
//     if (changeInfo.status === "complete" &&
//         tab.url &&
//         youtubeRegex.test(tab.url)) {
//         const queryParameters = tab.url.split("?")[1];
//         const urlParameters = new URLSearchParams(queryParameters);
//         const videoId = urlParameters.get("v");
//         chrome.runtime.sendMessage(tabId, {
//             type: "YT_TAB",
//             videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
//         });
//     }
//     else if (changeInfo.status === "complete" && tab.url) {
//         chrome.runtime.sendMessage(tabId, {
//             type: "NO_YT_TAB",
//         });
//     }
// });
