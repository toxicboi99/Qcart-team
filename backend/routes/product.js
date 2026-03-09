const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

router.post('/', upload.array('images', 4), createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', upload.array('images', 4), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
