// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var fs = require('fs-extra');
const spawn = require('child_process').spawn;
// const ytdl = require('ytdl-core');
var youtubedl = require('youtube-dl');
const { shell } = require('electron');
const homedir = require('os').homedir();
const {dialog} = require('electron').remote;
var ffmetadata = require('ffmetadata');

const downloader = require('./downloadBinary');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
console.log(`ffmpeg path: ${ffmpegPath}`);

const youtubeBinaryFilePath = youtubedl.getYtdlBinary();

console.log(`youtube-dl binary path: ${youtubeBinaryFilePath}`);

// create videos file if doesn't exist (default location)
var dir = `${homedir}/Desktop`;
var iTunesDir = `${homedir}/Music/iTunes/iTunes Media/Automatically Add to iTunes/`;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
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

// var url = 'https://www.youtube.com/watch?v=ZcAiayke00I';
function download(url, title, downloadAsAudio, youtubeUrl, saveAsTitleValue, artistValue, saveToiTunesValue) {
  let arguments = [];

  // set the url for ytdl
  arguments.push(url);

  // verbose output
  arguments.push('-v');

  // arguments.push('-f', 'bestvideo+bestaudio/best');

  arguments.push('--add-metadata');

  // arguments.push('--postprocessor-args');

  // arguments.push('-metadata');

  // arguments.push('artist=Pink Floyd')

  arguments.push('--ffmpeg-location');

  arguments.push(ffmpegPath);

  arguments.push('--no-mtime');

  arguments.push('--ignore-errors');


  // select download as audio or video
  if (downloadAsAudio) {
    // arguments.push('--add-metadata');
    // arguments.push('--postprocessor-args "-metadata artist=SEPHIROTH"');

    arguments.push('-f');

    // arguments.push('bestaudio');

    // don't want webm as audio
    arguments.push('bestaudio[ext!=webm]');

    /** conversion taking too long atm **/
    arguments.push('--extract-audio');

    arguments.push('--audio-format');

    arguments.push('mp3');

    // arguments.push('--add-metadata --postprocessor-args "-metadata artist=Pink\ Floyd"');


    // can add something here later
  } else {

    // download as mp4 if it's youtube (tired of reconverting .flv files)
    const isYouTubeDownload = url.match('youtube');
    if(isYouTubeDownload){
      console.log('downloading from youtube');

      arguments.push('-f');

      arguments.push('bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');
    }

    // arguments.push('best');
  }



  // // verbose output

  console.log(title);

  // replace forward slashes with underscores
  if (title) {
    console.log(title);
    title = title.replace(/\//g, '_');
    console.log('replacing');
  }


  // TODO: trim to max 255 letters

  // title is that passed or the one from youtube
  const fileName = title || '%(title)s';

  console.log(title);

  let inputtedUrl = selectVideoDirectoryInput.value;

  console.log(inputtedUrl);

  // create
  if (!fs.existsSync(inputtedUrl)) {
    fs.mkdirp(inputtedUrl);
  }

  console.log(__dirname);

  const filePath = inputtedUrl;

  const fileExtension = `%(ext)s`;

  let saveToFolder = `${filePath}/${fileName}.${fileExtension}`;

  console.log(saveToFolder);

  // save to videos directory
  arguments.push('-o', saveToFolder);

  console.log(arguments);

  // if (artistValue !== '' && downloadAsAudio) {
  //   console.log("huzza got here");
  //   console.log(saveToFolder);

  //   // Read song.mp3 metadata
  //   ffmetadata.read(saveToFolder, function(err, data) {
  //     if (err) console.error("Error reading metadata", err);
  //     else console.log(data);
  //   });

  //   var data = {
  //     artist: artistValue,
  //   };
  //   ffmetadata.write(saveToFolder, data, function(err) {
  //     if (err) console.error("Error writing metadata", err);
  //     else console.log("Data written");
  //   });
  // }

  // Set the artist for song.mp3
  // var data = {
  //   artist: "Me",
  // };
  // ffmetadata.write("song.mp3", data, function(err) {
  //     if (err) console.error("Error writing metadata", err);
  //     else console.log("Data written");
  // });

  // deleted for now since it requires ffmpeg
  // download as audio if needed
  // if(downloadAsAudio){
  //   console.log('Download as audio');
  //   arguments.push('-x');
  // }

  console.log(arguments);
  console.log("starting coMMAND!!!!!!!!!!!!!!!!!!!")
  const ls = spawn(youtubeBinaryFilePath, arguments);
  console.log(ls);
  console.log("EXECUTED coMMAND!!!!!!!!!!!!!!!!!!!")


  ls.stdout.on('data', data => {
    percentage.innerText = data;

    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', data => {
    percentage.innerText = data;

    console.log(`stderr: ${data}`);
  });

  ls.on('close', code => {
    playlistDownloadingDiv.style.display = 'none';
    titleDiv.style.display = '';

    // clear out inputs after
    youtubeUrl.value = '';
    saveAsTitleValue.value = '';
    artistValue.value = '';

    // if it ends successfully say download completed
    if (code == 0) {
      percentage.innerText = 'Download completed';
    }

    console.log(`child process exited with code ${code}`);

    // ffmpeg -i default.mp4 -metadata title="my title" -codec copy output.mp4 && mv output.mp4 default.mp4
    // ffmpeg -i input.mp3 -c copy -metadata artist="Someone" output.mp3
    // let ffarguments = [];
    // ffarguments.push('-i');
    // ffarguments.push(`${filePath}/${fileName}.mp3`);
    // ffarguments.push('-c');
    // ffarguments.push('copy')
    // ffarguments.push('-metadata');
    // ffarguments.push('artist=Someone');
    // ffarguments.push(`${homedir}/Downloads/ouptut.mp3`);
    // const ffls = spawn(ffmpegPath, ffarguments);

    // ffls.stdout.on('data', data => {
    //   percentage.innerText = data;

    //   console.log(`stdout!!!: ${data}`);
    // });

    // ffls.stderr.on('data', data => {
    //   percentage.innerText = data;

    //   console.log(`stderr!!!: ${data}`);
    // });

    if (saveToiTunesValue) {

      // console.log("READING METADATA");
      // ffmetadata.read(`${filePath}/${fileName}.mp3`, function(err, data) {
      //   if (err) console.error("Error reading metadata", err);
      //   else console.log(data);
      // });
      // console.log("DONE READING METADATA");

      // var data = {
      //   artist: artistValue,
      //   title: title,
      // };
      // ffmetadata.write(`${filePath}/${fileName}.mp3`, data, function(err) {
      //   if (err) console.error("Error writing metadata", err);
      //   else console.log("Data written");
      // });

      // Async with callbacks:
      fs.copy(`${filePath}/${fileName}.mp3`, `${homedir}/Downloads/${fileName}.mp3`, err => {
        if (err) return console.error(err)
        console.log('successfully added to iTunes!')
      })
    }
  });


}

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
  var downloadAsAudio = document.getElementsByClassName('downloadAsAudio')[0];
  var saveAsTitle = document.getElementsByClassName('saveAsTitle')[0];
  var artistName = document.getElementsByClassName('artist')[0];
  var saveToiTunes = document.getElementsByClassName('saveToiTunes')[0];

  var youtubeUrlValue = youtubeUrl.value;
  var saveAsTitleValue = saveAsTitle.value;
  var downloadAsAudioValue = downloadAsAudio.checked;
  var artistValue = artistName.value;
  var saveToiTunesValue = saveToiTunes.checked;
  console.log(saveToiTunesValue);

  // console.log(artistValue);

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

  // if (saveToiTunesValue) {
  //   console.log("GOT HRERERERERERERERERE");
  // }
  // if (artistValue !== '' && downloadAsAudio) {

  //   // ${homedir}\Music\iTunes\iTunes Media\Automatically Add to iTunes\

  //   console.log("huzza got here");
  //   console.log(saveToFolder);

  //   // Read song.mp3 metadata
  //   // ffmetadata.read(saveToFolder, function(err, data) {
  //   //   if (err) console.error("Error reading metadata", err);
  //   //   else console.log(data);
  //   // });

  //   // var data = {
  //   //   artist: artistValue,
  //   // };
  //   // ffmetadata.write(saveToFolder, data, function(err) {
  //   //   if (err) console.error("Error writing metadata", err);
  //   //   else console.log("Data written");
  //   // });
  // }
};

function youtubeDlInfoAsync(url, options) {
  return new Promise(function(resolve, reject) {
    youtubedl.getInfo(url, options, function(err, data) {
      if (err !== null) reject(err);
      else resolve(data);
    });
  });
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

document.getElementsByClassName('youtubeUrl')[0].onblur = async function() {
  await populateTitle();
};



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
    defaultPath: './videos',
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

// remove youtubedl from pathname to give containing folder
const youtubeBinaryContainingFolder = youtubeBinaryFilePath.substr(0, youtubeBinaryFilePath.lastIndexOf("\/"));

console.log(`youtubeBinaryContainingFolder: ${youtubeBinaryContainingFolder}`);

// update binary on boot
// downloader(youtubeBinaryContainingFolder, function error(err, done) {
//   if (err) { return console.log(err.stack); }
//   console.log(done);
// });
