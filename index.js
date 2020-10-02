const electron = require('electron');
const url = require('url');
const path = require('path');
const updatePhotomosaic = require('./bin/updatePhotomosaic');
const fs = require('fs');
const { dialog } = require('electron');
const child_process = require('child_process');
const { EventEmitter } = require('events');
const sharp = require('sharp');

const { app, BrowserWindow, Menu, ipcMain } = electron;

process.env.NODE_ENV = 'production';

let mainWindow;
let userImageWindow;
let photomosaicEmitter = new EventEmitter();
let filePath;

app.on('ready', function () {
   mainWindow = new BrowserWindow({
      webPreferences: {
         nodeIntegration: true
      }
   });
   mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'public', 'home.html'),
      protocol: 'file:',
      slashes: true
   }));
   mainWindow.on('closed', function () {
      app.quit();
   });

   const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
   Menu.setApplicationMenu(mainMenu);
});

function createUserImageWindow() {
   userImageWindow = new BrowserWindow({
      width: 500,
      height: 400,
      title: 'Create Photomosaic',
      webPreferences: {
         nodeIntegration: true
      }
   });
   userImageWindow.maximize();
   userImageWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'public', 'userImageWindow.html'),
      protocol: 'file:',
      slashes: true
   }));
   userImageWindow.on('closed', function () {
      userImageWindow = null;
   })


}

const mainMenuTemplate = [
   {
      label: 'File',
      submenu: [
         {
            label: 'Create Mosaic',
            accelerator: process.platform == 'darwin' ? 'Command+N' :
               'Ctrl+N',
            click() {
               dialog.showOpenDialog({
                  title: "Select the image to be uploaded",
                  buttonLabel: "Upload",
                  properties: ['openFile'],
                  filters: [
                     { name: 'Images', extensions: ['jpg', 'png'] },
                  ]
               }).then(file => {
                  if (!file.canceled) {
                     filePath = file.filePaths[0].toString();
                     console.log(filePath);
                     createUserImageWindow();
                     // let log = fs.createWriteStream(path.join(__dirname, 'log.txt'));
                     let child = child_process.spawn(
                        'node',
                        ['bin/updatePhotomosaicTask.js', filePath, false],
                        {
                           stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
                        }
                     );
                     let imgPath;
                     child.on('message', function (img) {
                        console.log("Recieved message: " + img);
                        imgPath = img;
                     });
                     child.on('exit', function () {
                        console.log("Child process exited");
                        userImageWindow.webContents.send('complete', imgPath);
                        child = null;
                     });
                  }
               });
            }
         },
         {
            label: 'Quit',
            accelerator: process.platform == 'darwin' ? 'Command+Q' :
               'Ctrl+Q',
            click() {
               app.quit();
            }
         }
      ]
   }
];

if (process.env.NODE_ENV !== 'production') {
   mainMenuTemplate.push({
      label: 'Developer Tools',
      submenu: [
         {
            label: 'Toggle Dev Tools',
            accelerator: process.platform == 'darwin' ? 'Command+I' :
               'Ctrl+I',
            click(item, focusedWindow) {
               focusedWindow.toggleDevTools();
            }
         },
         {
            role: 'reload'
         }
      ]
   })
}