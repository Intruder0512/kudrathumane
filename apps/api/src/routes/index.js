import { Router } from 'express';
import healthCheck from './health-check.js';
import stripeRouter from './stripe.js';
import fosterFamiliesRouter from './foster-families.js';
import lostFoundRouter from './lost-found.js';
import certificatesRouter from './certificates.js';
import socialMediaRouter from './social-media.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/stripe', stripeRouter);
    router.use('/foster-families', fosterFamiliesRouter);
    router.use('/lost-found', lostFoundRouter);
    router.use('/certificates', certificatesRouter);
    router.use('/social-media', socialMediaRouter);

    return router;
};