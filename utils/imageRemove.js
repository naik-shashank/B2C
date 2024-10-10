import {cloudinary} from './cloudinary.js'

const extractPublicIdFromUrl = (url) => {

  const match = url.split('/');

  if (match[match.length-2]) {
    let s=match[match.length-2]+'/'+match[match.length-1]
     return s.split('.')[0]
  } else {
    throw new Error('Invalid Cloudinary URL');
  }
};


const removeImg = (imageUrl) => {
  return new Promise((resolve, reject) => {
   
    try {
      const publicId = extractPublicIdFromUrl(imageUrl);
      console.log(publicId)
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Error deleting image from Cloudinary:", error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export {removeImg}