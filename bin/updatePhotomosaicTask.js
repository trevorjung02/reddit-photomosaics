const updatePhotomosaic = require('./updatePhotomosaic');

// process.send("C:/Users/trevo/Code/Projects/top-photo-mosaic-desktop/public/photomosaics/1601192470379.jpg");
// process.exit();

console.log(process.argv);
updatePhotomosaic(process.argv[2], process.argv[3] === 'true')
   .then((img) => {
      process.send(img);
      process.exit();
   })
   .catch(function (err) {
      process.send(err);
   });