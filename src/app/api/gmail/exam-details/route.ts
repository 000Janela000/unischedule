import { NextRequest, NextResponse } from 'next/server';

interface ExamDetail {
  subject: string;
  room: string;
  seat: string;
  variant: string;
}

function parseExamDetails(body: string): ExamDetail[] {
  const details: ExamDetail[] = [];

  // Split by common delimiters that might separate multiple exam entries
  const sections = body.split(/(?=საგანი:|Subject:)/gi).filter(Boolean);

  for (const section of sections) {
    const detail: ExamDetail = {
      subject: '',
      room: '',
      seat: '',
      variant: '',
    };

    // Parse subject (Georgian or English)
    const subjectMatch = section.match(/(?:საგანი|Subject)\s*[:：]\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      detail.subject = subjectMatch[1].trim();
    }

    // Parse room number - "ოთახი: XXX" or "Room: XXX" or "აუდიტორია: XXX"
    const roomMatch = section.match(
      /(?:ოთახი|აუდიტორია|Room|Auditorium)\s*[:：]\s*(.+?)(?:\n|$)/i
    );
    if (roomMatch) {
      detail.room = roomMatch[1].trim();
    }

    // Parse seat/place - "ადგილი: XXX" or "Seat: XXX" or "Place: XXX"
    const seatMatch = section.match(
      /(?:ადგილი|ადგილის ნომერი|Seat|Place)\s*[:：]\s*(.+?)(?:\n|$)/i
    );
    if (seatMatch) {
      detail.seat = seatMatch[1].trim();
    }

    // Parse variant - "ვარიანტი: X" or "Variant: X"
    const variantMatch = section.match(
      /(?:ვარიანტი|Variant)\s*[:：]\s*(.+?)(?:\n|$)/i
    );
    if (variantMatch) {
      detail.variant = variantMatch[1].trim();
    }

    // Only add if we found at least some useful information
    if (detail.subject || detail.room || detail.seat || detail.variant) {
      details.push(detail);
    }
  }

  return details;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('accessToken');

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'No access token provided',
        message: 'Connect your Gmail account in Settings to fetch exam details automatically.',
      },
      { status: 401 }
    );
  }

  try {
    // Search Gmail for exam-related emails
    const query = encodeURIComponent(
      'from:noreply newer_than:7d subject:გამოცდა OR subject:exam'
    );
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      if (searchResponse.status === 401) {
        return NextResponse.json(
          {
            error: 'Invalid or expired access token',
            message: 'Please reconnect your Gmail account in Settings.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to search Gmail', details: await searchResponse.text() },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();
    const messageIds: string[] = (searchData.messages || []).map(
      (m: { id: string }) => m.id
    );

    if (messageIds.length === 0) {
      return NextResponse.json({ details: [] });
    }

    // Fetch each message and parse exam details
    const allDetails: ExamDetail[] = [];

    for (const messageId of messageIds) {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
      const msgResponse = await fetch(msgUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();

      // Extract body text from the message payload
      let bodyText = '';

      if (msgData.payload) {
        // Handle simple body
        if (msgData.payload.body?.data) {
          bodyText = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
        }

        // Handle multipart messages
        if (msgData.payload.parts) {
          for (const part of msgData.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
        }
      }

      if (bodyText) {
        const parsed = parseExamDetails(bodyText);
        allDetails.push(...parsed);
      }
    }

    return NextResponse.json({ details: allDetails });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch exam details', message },
      { status: 500 }
    );
  }
}
