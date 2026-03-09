const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (file, folder = 'quickcart') => {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder });
    return result.secure_url;
};

// Create product with image upload
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, offerPrice, category, userId } = req.body;

        if (!name || !description || !price || !offerPrice || !category || !userId) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.buffer) {
                    const url = await uploadToCloudinary(file);
                    imageUrls.push(url);
                }
            }
        }

        if (imageUrls.length === 0) {
            return res.status(400).json({ error: 'At least one product image is required' });
        }

        const product = await Product.create({
            userId,
            name,
            description,
            price: parseFloat(price),
            offerPrice: parseFloat(offerPrice),
            image: imageUrls,
            category,
        });

        res.status(201).json(product);
    } catch (err) {
        console.error('Create product error:', err);
        res.status(400).json({ error: err.message });
    }
};

// Get all products (with optional category filter)
exports.getAllProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, offerPrice, category, existingImages } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (offerPrice !== undefined) updateData.offerPrice = parseFloat(offerPrice);
        if (category !== undefined) updateData.category = category;

        // Base images: use existingImages from form if provided, else keep product images
        let baseImages = product.image || [];
        if (existingImages) {
            try {
                const parsed = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
                if (Array.isArray(parsed)) baseImages = parsed;
            } catch (e) {
                // ignore invalid JSON
            }
        }

        // Add new uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.buffer) {
                    const url = await uploadToCloudinary(file);
                    baseImages.push(url);
                }
            }
        }
        if (baseImages.length > 0) {
            updateData.image = baseImages;
        }

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        console.error('Update product error:', err);
        res.status(400).json({ error: err.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
