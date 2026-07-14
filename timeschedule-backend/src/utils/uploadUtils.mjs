import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { put, del } from '@vercel/blob';


const createStorage = (uploadPath) => multer.diskStorage({
    destination: function (req, file, cb) {
        
        const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
        const basePath = isVercel ? '/tmp' : process.cwd();
        const fullPath = path.join(basePath, uploadPath);

        try {
            
            fs.mkdirSync(fullPath, { recursive: true });
            console.log('Created upload directory:', fullPath);
            cb(null, fullPath);
        } catch (error) {
            console.error('Error creating upload directory:', error);
            
            const fallbackPath = path.join('/tmp', path.basename(uploadPath));
            fs.mkdirSync(fallbackPath, { recursive: true });
            cb(null, fallbackPath);
        }
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});


const createFileFilter = (allowedMimeTypes) => (req, file, cb) => {
    console.log('File received in filter:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
    });

    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log('File type accepted:', file.mimetype);
        cb(null, true);
    } else {
        console.log('File type rejected:', file.mimetype);
        cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
};


const createMulter = (destinationPath, allowedMimeTypes) => {
    console.log('Creating multer instance with:', {
        destinationPath,
        allowedMimeTypes
    });

    
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

    const storage = isProduction
        ? multer.memoryStorage() 
        : createStorage(destinationPath); 

    return multer({
        storage: storage,
        fileFilter: createFileFilter(allowedMimeTypes),
        limits: {
            fileSize: 5 * 1024 * 1024 
        }
    });
};


const uploadToBlob = async (file, filename) => {
    try {
        console.log(' Uploading to Vercel Blob:', filename);

        const blob = await put(filename, file, {
            access: 'public',
        });

        console.log(' Upload successful:', blob.url);
        return blob.url;
    } catch (error) {
        console.error(' Upload failed:', error);
        throw error;
    }
};


const handleFileUpload = async (req, res, next) => {
    try {
        if (!req.files || !req.files['photo']) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        const file = req.files['photo'][0];
        const filename = `cakes/${Date.now()}_${file.originalname}`;

        
        const imageUrl = await uploadToBlob(file.buffer, filename);

        
        req.body.photoUrl = imageUrl;

        next();
    } catch (error) {
        console.error(' File upload error:', error);
        return res.status(500).json({ error: 'File upload failed' });
    }
};


const smartUpload = async (file, folder = 'assignments') => {
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    console.log(' smartUpload - Environment detected:', {
        isProduction,
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV
    });

    if (isProduction) {
        
        console.log(' smartUpload - Using Vercel Blob storage (production)');
        const filename = `${folder}/${Date.now()}_${file.originalname}`;

        try {
            
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                throw new Error('BLOB_READ_WRITE_TOKEN not configured');
            }

            console.log(' smartUpload - Blob configuration:', {
                hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
                tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + '...',
                storeId: process.env.BLOB_STORE_ID || 'not configured'
            });

            console.log(' smartUpload - File info:', {
                originalname: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                hasBuffer: !!file.buffer,
                hasPath: !!file.path
            });

            
            if (!file.buffer) {
                throw new Error('File buffer not available for Vercel Blob upload');
            }

            const blob = await put(filename, file.buffer, {
                access: 'public',
                addRandomSuffix: false,
                
                ...(process.env.BLOB_STORE_ID && { storeId: process.env.BLOB_STORE_ID })
            });
            console.log(' smartUpload - Vercel Blob upload successful:', blob.url);
            console.log(' smartUpload - Blob details:', {
                url: blob.url,
                pathname: blob.pathname,
                size: blob.size,
                uploadedAt: blob.uploadedAt
            });
            return blob.url;
        } catch (blobError) {
            console.error(' smartUpload - Vercel Blob upload failed:', blobError);
            throw blobError; 
        }
    } else {
        
        console.log(' smartUpload - Using local storage (development)');
        if (!file.path) {
            throw new Error('File path not available for local storage');
        }
        let filePathForImagePath = file.path;
        filePathForImagePath = filePathForImagePath.replace(/^public[\\/]/, '');
        console.log(' smartUpload - Local file path processed:', filePathForImagePath);
        return filePathForImagePath;
    }
};

const deleteFromBlob = async (url) => {
    try {
        console.log(' Deleting from Vercel Blob:', url);

        if (!url || !url.includes('blob.vercel-storage.com')) {
            console.log(' Not a Vercel Blob URL, skipping deletion');
            return false;
        }

        await del(url);
        console.log(' File deleted from Vercel Blob successfully');
        return true;
    } catch (error) {
        console.error(' Failed to delete from Vercel Blob:', error);
        return false;
    }
};

export default createMulter;
export { uploadToBlob, handleFileUpload, smartUpload, deleteFromBlob };
