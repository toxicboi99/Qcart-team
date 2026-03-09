const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
    try {
        const { type, name, email, phoneNumber, message } = req.body;

        if (!type || !name || !email) {
            return res.status(400).json({ error: 'Type, name, and email are required' });
        }

        if (!['sales', 'support'].includes(type)) {
            return res.status(400).json({ error: 'Type must be sales or support' });
        }

        const contact = await Contact.create({
            type,
            name,
            email,
            phoneNumber: phoneNumber || '',
            message: message || ''
        });

        res.status(201).json({
            message: 'Contact request received',
            contact: {
                _id: contact._id,
                type: contact.type,
                name: contact.name,
                email: contact.email
            }
        });
    } catch (err) {
        console.error('Contact submit error:', err.message);
        res.status(400).json({ error: err.message || 'Failed to submit contact' });
    }
};
