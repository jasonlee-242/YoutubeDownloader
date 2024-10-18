// import config from './config';

// const apiUrl = config.apiUrlProd;

let youtubeLink: string = "";
let fileFormat: "" | "mp3" | "mp4" = "";
let fileName: string = "myfile";
let linkInput: HTMLInputElement;
let downloadButton: HTMLButtonElement;
let fileNameInput: HTMLInputElement;
let mp3Button: HTMLButtonElement;
let mp4Button: HTMLButtonElement;
let notification: HTMLElement;

// ------------EVENT LISTENERS----------

const downloadAnimation: HTMLElement = document.getElementById('download-animation') as HTMLElement;
const downloadButtonText: HTMLElement = document.getElementById('download-base-text') as HTMLElement;

document.addEventListener("DOMContentLoaded", function () {
  downloadButton = document.getElementById("vid-download-button") as HTMLButtonElement;
  linkInput = document.getElementById("videolink") as HTMLInputElement;
  fileNameInput = document.getElementById("videoname") as HTMLInputElement;
  mp3Button = document.getElementById("mp3Button") as HTMLButtonElement;
  mp4Button = document.getElementById("mp4Button") as HTMLButtonElement;
  notification = document.getElementById("error-notification") as HTMLElement;
  linkInput.addEventListener("change", updateYouTubeUrlInput);
  downloadButton.addEventListener("click", downloadVideo);
  fileNameInput.addEventListener("input", updateFileName);
  mp3Button.addEventListener("click", () => selectFileType("mp3"));
  mp4Button.addEventListener("click", () => selectFileType("mp4"));
});

// ---------FUNCTIONS----------

// On a YT video -> Update the YT Link Input automatically to url
// of the page. Listens to background.js for tab changes/reloads
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "YT_TAB") {
    linkInput.value = youtubeLink = request.videoUrl; // Update the input field with the full YouTube URL
  } else if (request.type === "NO_YT_TAB") {
    linkInput.value = youtubeLink = "";
  }
});

function downloadVideo() {
  //add check for valid link in case they enter -> directly click download button
  if (youtubeLink === "") {
    throwNotice("Valid Youtube Link Missing");
    return;
  }

  if (! isValidYouTubeVideoUrl(youtubeLink)){
    throwNotice("Invalid Youtube Link");
  }
  if (fileFormat === "") {
      throwNotice("Please select a File Type");
      return;
  }

  let download_file = ""

  downloadButton.classList.add('hide');
  downloadButtonText.classList.add('hidden');
  downloadAnimation?.classList.remove('hidden');
  throwNotice("Downloading!", true);

  // Hidden URL
  fetch('127.0.0.1', {
      method: 'POST',
      mode: 'cors',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          youtubeLink: youtubeLink,
          fileFormat: fileFormat,
          fileName: fileName
      })
  })
      .then(response => {
      if (response.ok) {
          const contentDisposition = response.headers.get('Content-Disposition')
          if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
              // Extract the filename from Content-Disposition
              const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
              if (matches != null && matches[1]) {
                  download_file = matches[1].replace(/['"]/g, ''); // Remove quotes
              }
          }
          return response.blob(); // Get the response as a blob
      }
      throwNotice("There was an issue. Please try again.")
      throw new Error('Network response was not ok.');
  })
      .then(blob => {
      const url = window.URL.createObjectURL(blob); // Create a URL for the blob
      const a = document.createElement('a'); // Create an anchor element
      a.style.display = 'none';
      a.href = url; // Set the URL for the download
      a.download = download_file; // Set the default file name
      document.body.appendChild(a); // Append the anchor to the body
      a.click(); // Trigger the download
      window.URL.revokeObjectURL(url); // Clean up the URL
      a.remove(); // Remove the anchor from the document
  })
      .catch(error => {
      throwNotice("There was an error!")
      console.error('There was an error!', error);
  })
      .finally(() => {
        clear();
});
}

// Base check if URL is a valid YouTube video link
function isValidYouTubeVideoUrl(url: string) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

// Function to update the input field with the YouTube link
function updateYouTubeUrlInput(event: Event) {
  const inputTarget = event.target as HTMLInputElement;
  if (isValidYouTubeVideoUrl(inputTarget.value)) {
    linkInput.value = youtubeLink = inputTarget.value; // Set the current tab URL if it's valid
  } else {
    throwNotice("Invalid Youtube Link");
    linkInput.value = youtubeLink = ""; // Clear the input if it's not a valid YouTube URL
  }
}

// // Popup Alerts for Encountered Issues
function throwNotice(message: string, isDownloading: boolean = false) {
  notification.textContent = message;

  if (!isDownloading){
    notification.classList.add('error');
  }else{
    notification.classList.add('downloading');
  }
  notification.classList.remove("hidden");
  notification.classList.add("show");


  // Automatically hide the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");

    // Optionally add hidden class after fading out
    setTimeout(() => {
      notification.classList.add("hidden");
      notification.classList.remove("downloading", "error");
    }, 500); // Wait for the transition to finish before adding hidden
  }, 3000); // Adjust the time (3000 ms = 3 seconds)
}

// Set FileName Callback Function
function updateFileName(event: Event) {
  const target = event.target as HTMLInputElement;
  fileName = target.value;

  if (fileName.trim() === "") {
    fileName = "myfile";
  }
}

// Set Download Type Callback Function
function selectFileType(type: string) {
  if (type === "mp3") {
    fileFormat = "mp3";
    mp3Button.classList.add("selected");
    mp4Button.classList.remove("selected");
  } else if (type === "mp4") {
    fileFormat = "mp4";
    mp4Button.classList.add("selected");
    mp3Button.classList.remove("selected");
  }
}

// Reset Form after Downloading
function clear() {
  youtubeLink = "";
  fileNameInput.value = "";
  linkInput.value = "";

  downloadButton.classList.remove('hide');
  downloadButtonText.classList.remove('hidden');
  downloadAnimation?.classList.add('hidden');

  mp3Button.classList.remove("selected");

  mp4Button.classList.remove("selected");

  fileFormat = "";
  fileName = "myfile";
}
