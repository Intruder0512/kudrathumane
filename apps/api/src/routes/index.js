import { Router } from 'express';
import healthCheck from './health-check.js';
import stripeRouter from './stripe.js';
import fosterFamiliesRouter from './foster-families.js';
import lostFoundRouter from './lost-found.js';
import certificatesRouter from './certificates.js';
import socialMediaRouter from './social-media.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/stripe', requireUser, stripeRouter);
    router.use('/foster-families', requireAdmin, fosterFamiliesRouter);
    router.use('/lost-found', requireAdmin, lostFoundRouter);
    router.use('/certificates', requireAdmin, certificatesRouter);
    router.use('/social-media', requireAdmin, socialMediaRouter);

    return router;
};
