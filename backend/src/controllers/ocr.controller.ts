import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Production OCR Pipeline (Gemini Flash API)
 * Ultra-fast extraction replacing the local Python processes
 */
export const extractTextFromImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imagePath = path.resolve(req.file.path);
    
    // Read image as base64 string
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Define the JSON schema to strictly mimic the previous Python return payload
    const schema = {
      type: Type.OBJECT,
      properties: {
        roll_number: {
          type: Type.STRING,
          description: "The roll number of the student (e.g. 'EACA_1001', '1001', 'xyz'. Use 'NOT_FOUND' if completely missing)."
        },
        marks: {
          type: Type.STRING,
          description: "The marks or score evaluated on the paper (e.g. '85/100', '12 / 20'. Use 'NOT_FOUND' if missing)."
        },
        name: {
          type: Type.STRING,
          description: "The full name of the student if clearly written. Use 'NOT_FOUND' if missing."
        },
        raw_text: {
          type: Type.STRING,
          description: "A short 1-sentence summary of the document's contents."
        }
      },
      required: ["roll_number", "marks", "name", "raw_text"]
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    let retries = 4;
    let result: any = {};
    
    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              role: "user",
              parts: [
                { text: "Analyze the top header of this exam paper. Extract the student's roll number, their score/marks, and their name." },
                { inlineData: { data: base64Image, mimeType: req.file?.mimetype || 'image/jpeg' } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.1
          }
        });
        const outputText = response.text || "{}";
        result = JSON.parse(outputText);
        break; // success, exit the loop
      } catch (geminiError: any) {
        if (geminiError.status === 429 || geminiError.status === "RESOURCE_EXHAUSTED" || geminiError.message?.includes('429')) {
          retries--;
          if (retries === 0) throw geminiError;
          console.log(`Rate limited by Gemini. Retrying in 12 seconds... (${retries} attempts left)`);
          await delay(12000);
        } else {
          throw geminiError;
        }
      }
    }

    // Determine confidence based on what was found
    let confidence: 'high' | 'medium' | 'low' = 'low';
    const hasRoll = result.roll_number !== 'NOT_FOUND';
    const hasMarks = result.marks !== 'NOT_FOUND';
    if (hasRoll && hasMarks) confidence = 'high';
    else if (hasRoll || hasMarks) confidence = 'medium';

    res.json({
      success: true,
      data: {
        rawText: result.raw_text,
        extractedName: result.name !== 'NOT_FOUND' ? result.name : '',
        extractedRollNo: hasRoll ? result.roll_number.replace(/[^A-Z0-9_]/ig, '') : '',
        extractedMarks: hasMarks ? result.marks.replace(/[^0-9./]/g, '') : '',
        confidence: confidence.charAt(0).toUpperCase() + confidence.slice(1),
        imageUrl: `/${req.file.path.replace(/\\/g, '/')}`
      }
    });

  } catch (err: any) {
    console.error('OCR Pipeline Error:', err.message);
    res.status(500).json({ error: 'Failed to process image: ' + err.message });
  }
};
