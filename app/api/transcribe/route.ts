import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: Request) {
  const tempDir = path.join(process.cwd(), 'tmp')
  const fileName = `${uuidv4()}.webm`
  const filePath = path.join(tempDir, fileName)

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob
    const questionKey = formData.get('questionKey') as string

    if (!audioFile) {
      throw new Error('No audio file provided')
    }

    // Convert blob to Buffer and save to temp file
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    await writeFile(filePath, buffer)

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "verbose_json",
      temperature: 0.0,
      prompt: "This is a personal onboarding conversation where the user is describing themselves, their interests, and hobbies."
    })

    fs.unlinkSync(filePath)

    return NextResponse.json({ 
      text: transcription.text,
      questionKey
    })
  } catch (error) {
    console.error('Transcription error:', error)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}