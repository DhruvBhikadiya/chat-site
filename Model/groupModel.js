const multer = require('multer');
const path = require('path');

const imgpath = '/Uploades/groupImages';

const groupData = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,path.join(__dirname,'..',imgpath));
    },
    filename:(req,file,cb) => {
        cb(null,file.fieldname+'-'+Date.now());
    }
});

const uploadimage = groupData.uploadImage = multer({storage:groupData}).single('image');
const imagepath = groupData.imgpath = imgpath;

module.exports = { uploadimage, imagepath };