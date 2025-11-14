// backend/services/aiService.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generateCampaignContent = async (description, objective, adType) => {
  try {
    const prompt = `Generate engaging Facebook ad content for the following:

Description: ${description}
Objective: ${objective}
Ad Type: ${adType}

Please provide:
1. Engaging post copy (2-3 sentences)
2. 3 captivating captions (keep them short and impactful)
3. 5 relevant hashtags

Format the response as JSON with keys: postCopy, captions (array), hashtags (array)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional social media marketer specializing in Facebook advertising. Create compelling, concise, and conversion-focused content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const content = JSON.parse(completion.choices[0].message.content);
    return content;
  } catch (error) {
    console.error('AI Service Error:', error);
    // Fallback content if AI fails
    return {
      postCopy: `Exciting news! ${description}. Check it out now!`,
      captions: [
        'Don\'t miss out!',
        'Limited time offer',
        'Join us today!'
      ],
      hashtags: ['#Marketing', '#Business', '#Growth', '#Success', '#Digital']
    };
  }
};

exports.getScheduleRecommendation = async (objective, audienceData) => {
  try {
    const prompt = `Based on the following campaign details, suggest the best time to post on Facebook:

Objective: ${objective}
Audience Location: ${audienceData.location?.join(', ') || 'General'}
Audience Age: ${audienceData.minAge}-${audienceData.maxAge}

Provide a recommendation in JSON format with keys: dayOfWeek, timeOfDay, timezone, reason`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a social media analytics expert. Provide data-driven scheduling recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('AI Schedule Service Error:', error);
    return {
      dayOfWeek: 'Wednesday',
      timeOfDay: '10:00 AM',
      timezone: 'UTC',
      reason: 'Based on general best practices for Facebook engagement'
    };
  }
};
