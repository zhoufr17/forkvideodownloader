// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var fs = require('fs-extra');
const spawn = require('child_process').spawn;
const { shell } = require('electron');
const homedir = require('os').homedir();
const {dialog, BrowserWindow} = require('electron').remote;
const {remote} = require('electron');
// var npm = require('npm');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
console.log(`ffmpeg path: ${ffmpegPath}`);

const ytdlp = require('yt-dlp-exec');

//don't use, wanted to test
// let ytdlp;
// try {
//   ytdlp = require('yt-dlp-exec');
// } catch (e) {
//   console.error('Require failed:', e);
// }

// const downloadAudio = async (url) => {
//   try {
//     const output = await ytdlp(url, {
//       format: 'bestaudio/best',   // Example: Download best audio
//       extractAudio: true,         // Extract audio only
//       audioFormat: 'mp3',         // Convert to mp3 format
//     });
//     console.log('Download complete:', output);
//   } catch (error) {
//     console.error('Error downloading video:', error);
//   }
// };


// Progress Bar stuff
var value = 0,
// tb = document.getElementById("myBar"),
progress = document.getElementById("myBar");
barDiv = document.getElementById("myProgress");
barDiv.style.display = "none"; //start off hide the progress bar


// create videos file if doesn't exist (default location)
var dir = `${homedir}/Desktop`; //default
var tempDirectory = `${homedir}/videoDLtemp`; //where files are first downloaded
var iTunesDir = `${homedir}/Music/iTunes/iTunes Media/Automatically Add to iTunes/`;
var mPath = `${homedir}/Desktop/Music/Songs`;

if(fs.existsSync(mPath)) {
  dir = mPath;
  var autoITunes = document.getElementsByClassName('saveToiTunes')[0];
  var autoDLasAudio = document.getElementsByClassName('downloadAsAudio')[0];

  autoITunes.checked = true;
  autoDLasAudio.checked = true;
  // autoDLasAudio.disabled = true;

}

if (!fs.existsSync(tempDirectory)) {
  fs.mkdirSync(tempDirectory);
}

var saveToItunesCheck = document.getElementById(
  'saveToiTunes'
);
if (!fs.existsSync(iTunesDir)) {
  saveToItunesCheck.disabled = true;
}

function audioCheck(status) {
  console.log("AUDIOCHECK");
  status=!status;
  console.log(status);
  saveToItunesCheck.checked = false;
  saveToItunesCheck.disabled = status;
}


// select video input
var selectVideoDirectoryInput = document.getElementsByClassName(
  'selectVideoDirectoryInput'
)[0];

var playlistDownloadingDiv = document.getElementsByClassName(
  'playlistDownloadingDiv'
)[0];

var titleDiv = document.getElementsByClassName('titleDiv')[0];

var downloadPlaylistText = document.getElementsByClassName(
  'downloadPlaylistText'
)[0];

// new download using ytdlp (https://github.com/yt-dlp/yt-dlp)
async function download(url, title, downloadAsAudio, youtubeUrl, saveAsTitleValue, artistValue, saveToiTunesValue) {
  // Download options
  let options = {
    addMetadata: true,
    ffmpegLocation: ffmpegPath,
    ignoreErrors: true,
    noMtime: true,
    progress: true,
    noPlaylist: true,
    windowsFilenames: true,
  };

  console.log("flag 1")
  // updateProgressBar(18);

  // choose download audio or video
  if (downloadAsAudio) {
    options.format = 'bestaudio[ext!=webm]'; // Audio only (exclude webm)
    options.extractAudio = true;
    options.audioFormat = 'mp3';
  } else {
    // Download the best video format
    //option 1
    // options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';

    //option 2
    options.format = 'bestvideo+bestaudio/best';
    options.recodeVideo = 'mp4';
  }

  console.log("flag 2")
  // updateProgressBar(28);

  // Metadata options
  options.metadata = {
    title: title || saveAsTitleValue,
    artist: artistValue || ''
  };

  // Replace slashes in title
  title = title.replace(/\//g, '_');

  // Define the save path
  const savePath = `${tempDirectory}/${title}.%(ext)s`;
  options.output = savePath;

  console.log("flag 3")
  decrease(5)

  // Start download using yt-dlp
  try {
    // Start downloading
    console.log(`Starting download: ${url}`);
    percentage.innerText = 'Starting download';

    // Download video/audio using yt-dlp
    await ytdlp(url, options);
    updateProgressBar(98);
    console.log('Download completed!');
    
    percentage.innerText = 'Download completed';

    //original chiense version
    // percentage.innerText = 'Download Completed! (下载完成了！）';

    // Audio: rename to mp3
    // Video: rename to mp4
    if (downloadAsAudio) {
      const finalSavePath = `${dir}/${title}.mp3`;
      console.log(finalSavePath)
      fs.renameSync(savePath.replace('%(ext)s', 'mp3'), finalSavePath);
      console.log('Audio saved as mp3');
    } else {
      const finalSavePath = `${dir}/${title}.mp4`;
      fs.renameSync(savePath.replace('%(ext)s', 'mp4'), finalSavePath);
      console.log('Video saved as mp4');
    }

    // Handle iTunes saving
    if (saveToiTunesValue) {
      const iTunesPath = `${homedir}/Music/iTunes/iTunes Media/Automatically Add to iTunes/${title}.mp3`;
      fs.renameSync(savePath.replace('%(ext)s', 'mp3'), iTunesPath);
      console.log('File saved to iTunes');
    }
    
    // old version
    // if (saveToiTunesValue) {
    //   finalSaveLocation = `${homedir}/Music/iTunes/iTunes Media/Automatically Add to iTunes/${fileName}.mp3`;
    // }

    console.log("flag 4")

  } catch (error) {
    console.error('Download failed:', error);
    percentage.innerText = 'Error: Please double check video URL and try download again.';

    //original chiense version
    // percentage.innerText = 'ERROR: 您打进的网址有问题! 请您把打进的网址重新看一遍. 谢谢！';

    dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'error',
      buttons: ['Ok'],
      defaultId: 2,
      title: 'Download Error',
      message: 'An error occurred while downloading. Please check the URL and try again.',
    });

    //original chiense version
    // dialog.showMessageBox(remote.getCurrentWindow(), {
    //   type: 'error',
    //   buttons: ['Ok'],
    //   defaultId: 2,
    //   title: 'Error',
    //   message: '您打进的网址有问题. 请您把打进的网址重新看一遍， 然后重新再下载。如国问题还没解决请您问周先生。谢谢！',
    //   detail: '-周先生',
    //   checkboxChecked: true,
    // })
  }
  
  // clear out inputs after
  titleDiv.style.display = '';
  youtubeUrl.value = '';
  console.log("Youtube url value: " + youtubeUrl.value);
  saveAsTitleValue.value = '';
  console.log("saveAsTitleValue value: " + saveAsTitleValue.value);

  var artistSauce = document.getElementById('artist');
  artistSauce.value = '';
  console.log("artistValue value: " + artistValue);

  console.log("flag 4")

  // Progress bar cleanup
  barDiv.style.display = "none";
  decrease(1000);
}

// var url = 'https://www.youtube.com/watch?v=ZcAiayke00I';
// function download(url, title, downloadAsAudio, youtubeUrl, saveAsTitleValue, artistValue, saveToiTunesValue) {
//   let arguments = [];

//   // set the url for ytdl
//   arguments.push(url);

//   // verbose output
//   arguments.push('-v');

//   // arguments.push('-f', 'bestvideo+bestaudio/best');

//   arguments.push('--add-metadata');

//   // arguments.push('--postprocessor-args');

//   // arguments.push("-metadata 'title=George Washington'");

//   // arguments.push('--postprocessor-args');
//   // arguments.push("-metadata 'artist=Pink Floyed'");
//   // arguments.push("artist=Pink Floyd")

//   arguments.push('--ffmpeg-location');

//   arguments.push(ffmpegPath);

//   arguments.push('--no-mtime');

//   arguments.push('--ignore-errors');

//   // increase(15);
//   updateProgressBar(18);
//   // select download as audio or video
//   if (downloadAsAudio) {

//     arguments.push('-f');

//     // arguments.push('bestaudio');

//     // don't want webm as audio
//     arguments.push('bestaudio[ext!=webm]');

//     /** conversion taking too long atm **/
//     arguments.push('--extract-audio');

//     arguments.push('--audio-format');

//     arguments.push('mp3');

//     // arguments.push('--add-metadata --postprocessor-args "-metadata artist=Pink\ Floyd"');


//     // can add something here later
//   } else {

//     // download as mp4 if it's youtube (tired of reconverting .flv files)
//     const isYouTubeDownload = url.match('youtube');
//     if(isYouTubeDownload){
//       console.log('downloading from youtube');

//       arguments.push('-f');

//       arguments.push('bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');
//     }

//     // arguments.push('best');
//   }

//   // increase(10);
//   updateProgressBar(28);

//   // // verbose output

//   console.log(title);

//   // replace forward slashes with underscores
//   if (title) {
//     console.log(title);
//     title = title.replace(/\//g, '_');
//     console.log('replacing');

//   }

//   function somefunction(selector) {
//     return selector.replace(/(!|"|#|\$|%|\'|\(|\)|\*|\+|\,|\.|\/|\:|\;|\?|@)/g, function($1, $2) {
//         return "\\\\" + $2;
//     });
//   }

//   function somefunction2(selector) {
//     console.log("replacing COLON");
//     return selector.replace(/:/g, '\uA789');
//   }
//   // replace colons

//   console.log("fixing title up: " + title);
//   if (title) {
//     title = somefunction2(title);
//   }
//   console.log("done fixing title: " + title);

//   // TODO: trim to max 255 letters

//   // title is that passed or the one from youtube
//   // const fileName = title || '%(title)s';
//   const fileName = title;


//   // console.log(title);

//   let inputtedUrl = selectVideoDirectoryInput.value;

//   console.log(inputtedUrl);

//   // create
//   // if (!fs.existsSync(inputtedUrl)) {
//   //   fs.mkdirp(inputtedUrl);
//   // }

//   // console.log(__dirname);

//   const filePath = inputtedUrl;
//   const tempFilePath = tempDirectory;

//   const fileExtension = `%(ext)s`;

//   let saveToFolder = `${tempFilePath}/${fileName}.${fileExtension}`;

//   console.log(saveToFolder);

//   // save to videos directory
//   arguments.push('-o', saveToFolder);

//   console.log(arguments);

//   console.log(arguments);
//   const ls = spawn(youtubeBinaryFilePath, arguments);
//   console.log(ls);

//   // increase(20);
//   updateProgressBar(48);

//   ls.stdout.on('data', data => {
//     percentage.innerText = data;

//     console.log(`stdout: ${data}`);
//   });

//   ls.stderr.on('data', data => {
//     percentage.innerText = data;

//     console.log(`stderr: ${data}`);
//   });

//   ls.on('close', code => {
//     playlistDownloadingDiv.style.display = 'none';
//     // increase(20);
//     updateProgressBar(68);


//     // ffmpeg -i default.mp4 -metadata title="my title" -codec copy output.mp4 && mv output.mp4 default.mp4
//     // ffmpeg -i input.mp3 -c copy -metadata artist="Someone" output.mp3
//     let ffarguments = [];
//     ffarguments.push('-y')
//     ffarguments.push('-i');
//     if (downloadAsAudio) {
//       ffarguments.push(`${tempFilePath}/${fileName}.mp3`); //input for audio
//     } else {
//       ffarguments.push(`${tempFilePath}/${fileName}.mp4`); //input for video
//     }
//     ffarguments.push('-c');
//     ffarguments.push('copy')

//     if (artistValue != '') {
//       ffarguments.push('-metadata');
//       var customArtist = 'artist=' + artistValue;
//       ffarguments.push(customArtist);
//     }
//     ffarguments.push('-metadata');
//     var customTitle = 'title=' + title;
//     ffarguments.push(customTitle);

//     let finalSaveLocation = `${filePath}/${fileName}.${fileExtension}`;

//     if (downloadAsAudio) {
//       finalSaveLocation = `${filePath}/${fileName}.mp3`;
//     } else {
//       finalSaveLocation = `${filePath}/${fileName}.mp4`;
//     }
//     // `${homedir}/Music/iTunes/iTunes Media/Automatically Add to iTunes/`
//     if (saveToiTunesValue) {
//       finalSaveLocation = `${homedir}/Music/iTunes/iTunes Media/Automatically Add to iTunes/${fileName}.mp3`;
//     }
//     ffarguments.push(finalSaveLocation) //output location
//     console.log("FINAL LOCATION!!!!!!!!!!")
//     console.log(finalSaveLocation);
//     const ffls = spawn(ffmpegPath, ffarguments);

//     // increase(10);
//     updateProgressBar(78);
//     ffls.stdout.on('data', data => {
//       percentage.innerText = data;

//       console.log(`stdout!!!: ${data}`);
//     });

//     ffls.stderr.on('data', data => {
//       percentage.innerText = data;

//       console.log(`stderr!!!: ${data}`);
//     });

//     ffls.on('close', fcode => {
//       console.log("Cleanup files RN!!!")
//       updateProgressBar(98);

//       if (fcode == 0) {

//         percentage.innerText = 'Download Completed! (下载完成了！）';
//         // increase(20);
//         if (downloadAsAudio) {
//           fs.unlink(`${tempFilePath}/${fileName}.mp3`, (err => {
//             if (err) console.log(err);
//             else {
//               console.log("\nDeleted temp file: mp3");
//             }
//           }));
//         } else {
//           fs.unlink(`${tempFilePath}/${fileName}.mp4`, (err => {
//             if (err) console.log(err);
//             else {
//               console.log("\nDeleted temp file: mp4");
//             }
//           }));
//         }
//           // clear out inputs after
//         titleDiv.style.display = '';
//         youtubeUrl.value = '';
//         console.log("Youtube url value: " + youtubeUrl.value);
//         saveAsTitleValue.value = '';
//         console.log("saveAsTitleValue value: " + saveAsTitleValue.value);
//         // artistValue.value = '';

//         //fix this spaghetti code later!!!
//         var artistSauce = document.getElementById(
//           'artist'
//         );
//         artistSauce.value = '';
//         console.log("artistValue value: " + artistValue);

//       } else {

//         percentage.innerText = 'ERROR: 您打进的网址有问题! 请您把打进的网址重新看一遍. 谢谢！';

//         const options = {
//           type: 'error',
//           buttons: ['Ok'],
//           defaultId: 2,
//           title: 'Error',
//           message: '您打进的网址有问题. 请您把打进的网址重新看一遍， 然后重新再下载。如国问题还没解决请您问周先生。谢谢！',
//           detail: '-周先生',
//           checkboxChecked: true,
//         };

//         dialog.showMessageBox(remote.getCurrentWindow(), options, (response, checkboxChecked) => {
//           console.log(response);
//           console.log(checkboxChecked);
//         });

//       }

//       console.log(`child process exited with code ffmpeg ${code}`);
//     });
//     // if it ends successfully say download completed
//     if (code == 0) {
//       percentage.innerText = 'Download completed';
//     } else {
//       percentage.innerText = 'Error: Please double check video URL and try download again.';
//     }



//     console.log(`child process exited with code ${code}`);

//     // Progress bar cleanup
//     // barDiv.style.display = "none";
//     // decrease(1000);

//   });
// }

// start download button
var startDownload = document.getElementsByClassName('startDownload')[0];

// open folder button
var openFolder = document.getElementsByClassName('openFolder')[0];

// percentage div
var percentage = document.getElementsByClassName('percentage')[0];

// playlistDownloadingDiv
// titleDiv
// downloadPlaylistText

openFolder.onclick = function(){

  var value = document.getElementsByClassName('selectVideoDirectoryInput')[0].value;
  shell.openItem(value);
};


startDownload.onclick = function() {
  console.log("Starting Donwload!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  var youtubeUrl = document.getElementsByClassName('youtubeUrl')[0];
  var saveAsTitle = document.getElementsByClassName('saveAsTitle')[0];
  var artistName = document.getElementsByClassName('artist')[0];
  var saveToiTunes = document.getElementsByClassName('saveToiTunes')[0];
  var downloadAsAudio = document.getElementsByClassName('downloadAsAudio')[0];


  var youtubeUrlValue = youtubeUrl.value;
  var vulnsaveAsTitleValue = saveAsTitle.value;
  var downloadAsAudioValue = downloadAsAudio.checked;
  var vulnArtistValue = artistName.value;
  var saveToiTunesValue = saveToiTunes.checked;
  console.log(saveToiTunesValue);

  var saveAsTitleValue = vulnsaveAsTitleValue.trim();
  var artistValue = vulnArtistValue.trim();
  // console.log(artistValue);


  if (youtubeUrlValue === '') {
    const options = {
      type: 'error',
      buttons: ['Ok'],
      defaultId: 2,
      title: 'Error',
      message: '请把网址粘贴再下载. 谢谢！',
      detail: '-周先生',
      checkboxChecked: true,
    };

    dialog.showMessageBox(remote.getCurrentWindow(), options, (response, checkboxChecked) => {
      console.log(response);
      console.log(checkboxChecked);
    });
  } else if (saveAsTitleValue === '') {
    const options = {
      type: 'error',
      buttons: ['Ok'],
      defaultId: 2,
      title: 'Error',
      message: '请把歌曲粘贴再下载. 谢谢！',
      detail: '-周先生',
      checkboxChecked: true,
    };

    dialog.showMessageBox(remote.getCurrentWindow(), options, (response, checkboxChecked) => {
      console.log(response);
      console.log(checkboxChecked);
    });
  } else {
    barDiv.style.display = "block";
    // increase(5);
    decrease(1000);
    updateProgressBar(8);
    download(
      youtubeUrlValue,
      saveAsTitleValue,
      downloadAsAudioValue,
      youtubeUrl,
      saveAsTitle,
      artistValue,
      saveToiTunesValue
    );

    percentage.scrollIntoView();
  }
};

// function youtubeDlInfoAsync(url, options) {
//   return new Promise(function(resolve, reject) {
//     youtubedl.getInfo(url, options, function(err, data) {
//       if (err !== null) reject(err);
//       else resolve(data);
//     });
//   });
// }



function youtubeDlInfoAsync(url, options = []) {
  return ytdlp(url, options);
}

async function populateTitle() {

  // get save as title div
  var saveAsTitle = document.getElementsByClassName('saveAsTitle')[0];

  // get text from youtube url div value
  let text = document.getElementsByClassName('youtubeUrl')[0].value;


  const isBrighteonDownload = text.match('brighteon');

  let options;
  if (isBrighteonDownload) {
    options = ['-f bestvideo'];
  } else {
    options = ['-j', '--flat-playlist', '--dump-single-json'];
  }

  const info = await youtubeDlInfoAsync(text, options);

  // if its a playlist or channel
  if (info.length > 2) {
    console.log(info);

    const playlistinfo = info[info.length - 1];

    const uploader = playlistinfo.uploader;
    const amountOfUploads = playlistinfo.entries.length;

    console.log(uploader, amountOfUploads);

    downloadPlaylistText.innerHTML = `${amountOfUploads} Item Playlist or Channel To Be Downloaded`;
    playlistDownloadingDiv.style.display = '';
    titleDiv.style.display = 'none';

    selectVideoDirectoryInput.value =
      selectVideoDirectoryInput.value + '/' + uploader;

    console.log('an array');
  } else if (info.length == 2) {

    // TODO: trim here

    const trimmedTitle = info[0].title.substring(0, 200);

    saveAsTitle.value = trimmedTitle;

    playlistDownloadingDiv.style.display = 'none';
    titleDiv.style.display = '';

    playlistDownloadingDiv.style.display = 'none';
    titleDiv.style.display = '';

    console.log('single item');
  } else if (info && info.title) {

    const trimmedTitle = info.title.substring(0, 200);

    // TODO: trim here
    saveAsTitle.value = trimmedTitle;

    playlistDownloadingDiv.style.display = 'none';
    titleDiv.style.display = '';

    console.log('single item');
  } else {
    console.log('ERROR');
  }

  console.log(info);
}

// document.getElementsByClassName('youtubeUrl')[0].onblur = async function() {
//   await populateTitle();
// };



// frontend code
function myFunction() {
  /** WHEN PASTED **/

  // get the copied text off the clipboard
  navigator.clipboard
    .readText()
    .then(async text => {

      // update frontend to reflect text from clipboard
      document.getElementsByClassName('youtubeUrl')[0].value = text;

      //
      await populateTitle();
    })
    .catch(err => {
      console.log(err);
    });
}

/** SELECT DIRECTORY **/

const saveToDirectory = dir;

selectVideoDirectoryInput.value = saveToDirectory;

const selectVideoDirectoryButton = document.getElementsByClassName(
  'selectVideoDirectory'
)[0];

const selectVideoDirectory = (selectVideoDirectoryButton.onclick = function() {
  // get path from electron and load it as selectedPath
  var selectedPath = dialog.showOpenDialog({
    defaultPath: './',
    properties: ['openDirectory']
  });

  console.log(selectedPath[0]);

  // test if it's a shorter url because its within contained
  var newThing = selectedPath[0].split(__dirname)[1];

  let adjustedUrlWithCurrentDirectory;
  if (newThing) {
    adjustedUrlWithCurrentDirectory = `.${newThing}`;
  } else {
    adjustedUrlWithCurrentDirectory = selectedPath[0];
  }
  console.log(newThing);

  // console.log(newThing);

  selectVideoDirectoryInput.value = adjustedUrlWithCurrentDirectory;

  if (!fs.existsSync(adjustedUrlWithCurrentDirectory)) {
    fs.mkdirSync(adjustedUrlWithCurrentDirectory);
  }

});

// probably delete later
// selectVideoDirectoryButton.onclick = async function() {
//   try {
//     console.log("hi")
//     // Show the open directory dialog and await its result
//     const selectedPath = await dialog.showOpenDialog({
//       defaultPath: './',
//       properties: ['openDirectory']
//     });

//     // If the user cancels the dialog or selects nothing, exit
//     if (selectedPath.canceled || selectedPath.filePaths.length === 0) {
//       console.log('No directory selected');
//       return;
//     }

//     // Get the selected path (first path in the array)
//     const selectedFolderPath = selectedPath.filePaths[0];
//     console.log('Selected Path:', selectedFolderPath);

//     // Adjust the path based on __dirname
//     const relativePath = selectedFolderPath.split(__dirname)[1];
//     let adjustedUrlWithCurrentDirectory;
//     if (relativePath) {
//       adjustedUrlWithCurrentDirectory = `.${relativePath}`;
//     } else {
//       adjustedUrlWithCurrentDirectory = selectedFolderPath;
//     }

//     console.log('Adjusted Path:', adjustedUrlWithCurrentDirectory);

//     // Assuming selectVideoDirectoryInput is the input element where the path is shown
//     const selectVideoDirectoryInput = document.getElementById('selectVideoDirectoryInput');
//     selectVideoDirectoryInput.value = adjustedUrlWithCurrentDirectory;

//     // Now you can perform your fs-extra operation if needed (e.g., ensure directory exists)
//     await fs.ensureDir(adjustedUrlWithCurrentDirectory);
//     console.log(`Directory ensured: ${adjustedUrlWithCurrentDirectory}`);

//   } catch (error) {
//     console.error('Error selecting directory:', error);
//   }
// };

// function increase(number){
//   value += number;// same as value += 1, but better
//   if(value>=100) value = 100;//keep it under 100%
//   // tb.value = value;// set the value of the text field
//   progress.innerHTML = value + "%";
//   progress.style.width = value + "%";// set the width of the progress bar
// }

function updateProgressBar(max) {
  var percentage = max;
  // var curr = progressBar.value;
  // var curr = value;
  if(value>=100) value = 100;//keep it under 100%
  var update = setInterval(function() {
    if (value > percentage) {
      clearInterval(update);
    }
    value++;
    progress.innerHTML = value + "%";
    progress.style.width = value + "%";
    // value = curr;
  }, 15)
}

function decrease(number){
  value -= number;
  if(value<=0) value = 0;//keep it over 0%
  // tb.value = value;
  progress.innerHTML = value + "%";
  progress.style.width = value + "%";
}

function updater() {
    npm.load(function () {
    npm.commands.outdated({json: true}, function (err, data) {
    //console.log(data);
    npm.commands.update(function(err, d){
        console.log(d);
    });
   });
});
}
// update binary on boot  (Fix this so that it updates when pressing a button instead!!!)
// downloader(youtubeBinaryContainingFolder, function error(err, done) {
//   if (err) { return console.log(err.stack); }
//   console.log(done);
// });
