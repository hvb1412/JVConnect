import cloudinary from '../services/cloudinary.js';

export const uploadImageByUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }

    const result = await cloudinary.uploader.upload(url, {
      folder: 'jvconnect',
      resource_type: 'image',
    });

    return res.status(200).json({
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    return next(error);
  }
};
