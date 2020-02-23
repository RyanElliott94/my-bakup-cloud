// const functions = require("firebase-functions");
// const os = require('os');
// const path = require('path');
// const spawn = require('child-process-promise').spawn;
// const { Storage } = require('@google-cloud/storage');
// const projectId = 'mybakupcloud';
// let gcs = new Storage ({
//   projectId
// });
// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
// exports.onFileChange= functions.region("europe-west1").storage.object().onFinalize(event => {
//     const object = event.data;
//     const bucket = event.bucket;
//     const contentType = event.contentType;
//     const filePath = event.name;
//     console.log('File change detected, function execution started');

//     if (event.resourceState === 'not_exists') {
//         console.log('We deleted a file, exit...');
//         return;
//     }

//     if (path.basename(filePath).startsWith('thumb-')) {
//         console.log('We already renamed that file!');
//         return;
//     }

//     const destBucket = gcs.bucket(bucket);
//     const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
//     const metadata = { contentType: contentType };
//     return destBucket.file(filePath).download({
//         destination: tmpFilePath
//     }).then(() => {
//         return spawn('convert', [tmpFilePath, '-resize', '512x512', tmpFilePath]);
//     }).then(() => {
//         return destBucket.upload(tmpFilePath, {
//             destination: 'thumb-' + path.basename(filePath),
//             metadata: metadata
//         })
//     });
// });