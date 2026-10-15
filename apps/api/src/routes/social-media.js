import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Story templates based on story type
const storyTemplates = {
  rescue: {
    story: 'Meet {dogName}, a {breed} rescued from the streets. Now thriving in a loving home, {dogName} is ready for adoption and waiting for their forever family!',
    instagram: '{dogName} 🐕 Rescued. Loved. Ready for forever. {dogName} is looking for a family who will cherish them as much as we do. Adopt today! 🏡❤️',
    facebook: 'This is {dogName}, a beautiful {breed} who was rescued and is now looking for their forever home. {dogName} has shown incredible resilience and is ready to bring joy to a loving family. If you\'re interested in adoption, please reach out!',
    twitter: '{dogName} the {breed} was rescued and is now thriving! Ready for adoption. Give a deserving dog a second chance. 🐕❤️',
  },
  adoption: {
    story: '{dogName}, a {breed}, has found their forever home! Watch as this amazing dog settles into their new family and discovers what unconditional love truly means.',
    instagram: 'Success story! 🎉 {dogName} has found their forever home! Swipe to see the joy and love in this beautiful adoption journey. #AdoptDontShop',
    facebook: 'We\'re thrilled to share that {dogName} has been adopted! This {breed} is now part of a loving family and living their best life. Congratulations to the new family!',
    twitter: 'Adoption success! 🎉 {dogName} the {breed} has found their forever home. Every adoption saves a life. #AdoptDontShop',
  },
  foster: {
    story: '{dogName}, a {breed}, is looking for a foster family! Help us provide temporary care while we find their perfect match. Foster families are heroes!',
    instagram: 'Foster needed! 🏡 {dogName} is looking for a temporary home. Foster families make a huge difference. Can you help? DM us to learn more! 🐕❤️',
    facebook: 'We\'re looking for a foster family for {dogName}, a wonderful {breed}. Fostering is a rewarding way to help dogs in need while they await adoption. Interested?',
    twitter: 'Foster needed! {dogName} the {breed} is looking for a temporary home. Help save lives by fostering! 🐕 #FosterDontBuy',
  },
  medical: {
    story: '{dogName}, a {breed}, is recovering from a medical emergency. Thanks to our supporters, {dogName} is on the path to recovery and will soon be ready for adoption!',
    instagram: 'Recovery update! 💪 {dogName} is healing beautifully thanks to your support. This {breed} is a fighter and will soon be ready for their forever home! 🐕❤️',
    facebook: '{dogName} is making an amazing recovery! This {breed} faced a medical challenge, but with your help, {dogName} is now thriving and ready for adoption.',
    twitter: 'Recovery success! 💪 {dogName} the {breed} is healing well. Thank you for supporting our medical fund! #RescueDog',
  },
  event: {
    story: 'Join us at our upcoming adoption event! Meet {dogName} and many other wonderful dogs looking for their forever homes. {dogName} is a {breed} with a heart of gold!',
    instagram: 'Event alert! 📅 Meet {dogName} and other amazing dogs at our adoption event! {dogName} is a {breed} waiting to meet you. Save the date! 🐕❤️',
    facebook: 'You\'re invited to our adoption event! Come meet {dogName}, a beautiful {breed}, and many other wonderful dogs looking for loving homes. We can\'t wait to see you!',
    twitter: 'Adoption event coming! 📅 Meet {dogName} the {breed} and other amazing dogs. Join us for a day of fun and find your new best friend! 🐕',
  },
};

// POST /social-media/generate-story
// Generates social media content for a dog
router.post('/generate-story', async (req, res) => {
  const { dog_id, story_type, tone } = req.body;

  // Validate required fields
  if (!dog_id || !story_type) {
    return res.status(400).json({
      error: 'Missing required fields: dog_id, story_type',
    });
  }

  // Validate story type
  if (!storyTemplates[story_type]) {
    return res.status(400).json({
      error: `Invalid story_type. Allowed values: ${Object.keys(storyTemplates).join(', ')}`,
    });
  }

  try {
    // Fetch dog details from PocketBase
    const dog = await pb.collection('dogs').getOne(dog_id);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Get template for story type
    const template = storyTemplates[story_type];

    // Replace placeholders with dog details
    const replacements = {
      '{dogName}': dog.name || 'Our Dog',
      '{breed}': dog.breed || 'mixed breed',
      '{age}': dog.age || 'young',
      '{color}': dog.color || 'beautiful',
    };

    const generateContent = (text) => {
      let result = text;
      Object.entries(replacements).forEach(([key, value]) => {
        result = result.replace(new RegExp(key, 'g'), value);
      });
      return result;
    };

    // Generate content for all platforms
    const storyText = generateContent(template.story);
    const instagramCaption = generateContent(template.instagram);
    const facebookPost = generateContent(template.facebook);
    const twitterPost = generateContent(template.twitter);

    // Ensure Twitter post is within 280 character limit
    const twitterTrimmed = twitterPost.length > 280 
      ? twitterPost.substring(0, 277) + '...' 
      : twitterPost;

    // Generate hashtags based on story type and dog details
    const hashtags = generateHashtags(story_type, dog);

    logger.info(`Social media story generated for dog ${dog.name} - Type: ${story_type}`);
    res.json({
      success: true,
      dogId: dog_id,
      storyType: story_type,
      storyText,
      instagramCaption,
      facebookPost,
      twitterPost: twitterTrimmed,
      hashtags,
      characterCounts: {
        instagram: instagramCaption.length,
        facebook: facebookPost.length,
        twitter: twitterTrimmed.length,
      },
    });
  } catch (error) {
    logger.error(`Failed to generate social media story: ${error.message}`);
    throw new Error(`Failed to generate story: ${error.message}`);
  }
});

// POST /social-media/generate-hashtags
// Generates relevant hashtags based on story type and dog details
router.post('/generate-hashtags', async (req, res) => {
  const { story_type, dog_details } = req.body;

  // Validate required fields
  if (!story_type) {
    return res.status(400).json({
      error: 'Missing required field: story_type',
    });
  }

  try {
    // Generate hashtags
    const hashtags = generateHashtags(story_type, dog_details || {});

    logger.info(`Hashtags generated for story type: ${story_type}`);
    res.json({
      success: true,
      storyType: story_type,
      hashtags,
      count: hashtags.length,
    });
  } catch (error) {
    logger.error(`Failed to generate hashtags: ${error.message}`);
    throw new Error(`Failed to generate hashtags: ${error.message}`);
  }
});

// Helper function to generate hashtags based on story type and dog details
function generateHashtags(storyType, dogDetails = {}) {
  const baseHashtags = [
    '#AdoptDontShop',
    '#RescueDog',
    '#KudratHumane',
    '#DogRescue',
    '#SaveALife',
    '#FureverHome',
    '#AdoptMe',
    '#RescueStory',
  ];

  const typeSpecificHashtags = {
    rescue: ['#RescuedDog', '#SecondChance', '#DogSaved', '#RescueHero'],
    adoption: ['#AdoptionSuccess', '#FamilyComplete', '#DogAdoption', '#HappyEnding'],
    foster: ['#FosterDog', '#FosterFamily', '#FosterCare', '#FosterSavesLives'],
    medical: ['#MedicalEmergency', '#DogRecovery', '#HealingJourney', '#SupportNeeded'],
    event: ['#AdoptionEvent', '#MeetAndGreet', '#DogEvent', '#CommunityEvent'],
  };

  const breedHashtags = {
    labrador: ['#LabradorLove', '#LabLife'],
    german_shepherd: ['#GermanShepherd', '#GSDLove'],
    golden_retriever: ['#GoldenRetriever', '#GoldenLove'],
    mixed: ['#MixedBreed', '#MuttLove'],
  };

  const ageHashtags = {
    puppy: ['#PuppyLove', '#YoungPup'],
    senior: ['#SeniorDog', '#SeniorLove', '#OlderDog'],
  };

  // Start with base hashtags
  let hashtags = [...baseHashtags];

  // Add type-specific hashtags
  if (typeSpecificHashtags[storyType]) {
    hashtags = hashtags.concat(typeSpecificHashtags[storyType]);
  }

  // Add breed-specific hashtags if provided
  if (dogDetails.breed) {
    const breedKey = dogDetails.breed.toLowerCase().replace(/\s+/g, '_');
    if (breedHashtags[breedKey]) {
      hashtags = hashtags.concat(breedHashtags[breedKey]);
    }
  }

  // Add age-specific hashtags if provided
  if (dogDetails.age) {
    const ageKey = dogDetails.age.toLowerCase();
    if (ageHashtags[ageKey]) {
      hashtags = hashtags.concat(ageHashtags[ageKey]);
    }
  }

  // Add condition-specific hashtags if provided
  if (dogDetails.condition) {
    if (dogDetails.condition.toLowerCase().includes('injured') || dogDetails.condition.toLowerCase().includes('sick')) {
      hashtags.push('#NeedsHelp', '#MedicalCare');
    }
  }

  // Remove duplicates and return
  return [...new Set(hashtags)];
}

export default router;