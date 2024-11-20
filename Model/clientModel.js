
const multer = require('multer');
const path = require('path');

const imgpath = '/Uploades/userImages';

const clientData = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,path.join(__dirname,'..',imgpath));
    },
    filename:(req,file,cb) => {
        cb(null,file.fieldname+'-'+Date.now());
    }
});

const uploadimage = clientData.uploadImage = multer({storage:clientData}).single('image');
const imagepath = clientData.imgpath = imgpath;

module.exports = { uploadimage, imagepath };