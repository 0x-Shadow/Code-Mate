"use client"
import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import React from 'react'
import { CONVEX_URL, isConvexConfigured } from '@/lib/env'


const convex = isConvexConfigured ? new ConvexReactClient(CONVEX_URL) : null
//Creates a Convex database client using your Convex deployment URL
//Null when env keys are missing (demo mode) — children render without DB.


const ConvexClientProvider = ({children}:{children:React.ReactNode}) => {
  if (!convex) {
    return (
      <ClerkProvider>
        {children}
      </ClerkProvider>
    )
  }
  return (
    //Authentication Layer: ClerkProvider wraps your app with Clerk authentication
    // Database Integration: ConvexProviderWithClerk connects Convex database with Clerk auth
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
        </ConvexProviderWithClerk>

    </ClerkProvider>
  )
}

export default ConvexClientProvider