import { createClerkClient } from '@clerk/backend';

export interface CreateClerkUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string; // Optional - if not provided, a random password will be generated
  skipEmailVerification?: boolean; // Set to true to skip email verification
}

export class ClerkService {
  private client: ReturnType<typeof createClerkClient>;

  constructor() {
    // Clerk client uses CLERK_SECRET_KEY from environment variables
    this.client = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
  }

  /**
   * Generate secure password that meets Clerk requirements
   */
  private generateSecurePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+[]{}';
    const allChars = lowercase + uppercase + numbers + special;
    const length = 16;

    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate a username from first name and last name (for Clerk username requirement)
   * Formats as: firstname_lastname (lowercase, underscores, no accents)
   * Falls back to email if names are not provided
   */
  private generateUsernameFromName(firstName?: string, lastName?: string, email?: string): string {
    if (firstName && lastName) {
      // Combine first and last names, normalize and format
      const fullName = `${firstName} ${lastName}`
        .toLowerCase()
        .normalize('NFD') // Normalize to decomposed form to separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Clerk typically limits usernames to 50 chars
      
      if (fullName) {
        return fullName;
      }
    }
    
    // Fallback to email-based username if names are not available
    if (email) {
      const username = email.split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .substring(0, 50);
      return username || `user_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Final fallback
    return `user_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a new user in Clerk
   * @param input User data for Clerk
   * @returns The created Clerk user ID
   */
  async createUser(input: CreateClerkUserInput): Promise<string> {
    try {
      // Build the user creation payload
      const createUserPayload: any = {
        emailAddress: [input.email],
      };

      // Add optional fields if provided
      if (input.firstName) {
        createUserPayload.firstName = input.firstName;
      }
      if (input.lastName) {
        createUserPayload.lastName = input.lastName;
      }

      // Generate username from first name and last name (Clerk requires username based on instance settings)
      createUserPayload.username = this.generateUsernameFromName(input.firstName, input.lastName, input.email);

      const shouldSendInvitation = !input.password;

      // Clerk instances generally require password on user creation.
      // Generate a secure temporary password when one is not provided.
      createUserPayload.password = input.password || this.generateSecurePassword();

      // Skip email verification during user creation - we'll handle it via invitation email instead
      // This avoids conflicts between Clerk's automatic verification and our invitation flow
      // If password provided, respect caller preference; otherwise skip so invitation handles verification.
      createUserPayload.skipEmailVerification = shouldSendInvitation
        ? true
        : (input.skipEmailVerification ?? false);

      const clerkUser = await this.client.users.createUser(createUserPayload);

      // Always send an invitation email when no password is provided (the default flow)
      // This ensures the user receives a welcome email and can set their password
      // The invitation email can be customized in Clerk Dashboard to include "Welcome to Alenna" message
      if (shouldSendInvitation) {
        try {
          await this.sendInvitationEmail(clerkUser.id, input.email);
        } catch (inviteError: any) {
          // Log the error but don't fail user creation if invitation fails
          // User can request password reset later if needed
          console.warn('Failed to send invitation email, but user was created:', inviteError.message);
        }
      }

      return clerkUser.id;
    } catch (error: any) {
      console.error('Error creating Clerk user:', error);
      
      // Provide more detailed error information
      if (error.errors && error.errors.length > 0) {
        const errorMessages = error.errors.map((e: any) => e.longMessage || e.message).join('; ');
        throw new Error(`Failed to create Clerk user: ${errorMessages}`);
      }
      
      throw new Error(`Failed to create Clerk user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Send an invitation email to a user so they can set their password
   * @param _clerkId The Clerk user ID (kept for logging/future use)
   * @param email The user's email address
   */
  async sendInvitationEmail(_clerkId: string, email: string): Promise<void> {
    try {
      // Create an invitation which will trigger Clerk to send an invitation email
      // Use ignoreExisting: true to allow invitations even if the user already exists
      // The user will receive an email with a link to verify their email and set their password
      const invitation = await this.client.invitations.createInvitation({
        emailAddress: email,
        ignoreExisting: true, // Important: allows invitation even if user already exists
        // Optional: specify a redirect URL after they accept the invitation
        // If not specified, Clerk will use the default redirect URL from your Clerk Dashboard
      });
      
      console.log(`✅ Invitation created and email sent to ${email}. Invitation ID: ${invitation.id}`);
    } catch (error: unknown) {
      console.error('❌ Error sending invitation email:', error);
      
      // Log detailed error information for debugging
      if (error && typeof error === 'object' && 'errors' in error) {
        const clerkErrors = (error as any).errors;
        console.error('Clerk API errors:', JSON.stringify(clerkErrors, null, 2));
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send invitation email: ${errorMessage}`);
    }
  }

  /**
   * Delete a user from Clerk
   * @param clerkId The Clerk user ID
   */
  async deleteUser(clerkId: string): Promise<void> {
    try {
      await this.client.users.deleteUser(clerkId);
    } catch (error: any) {
      console.error('Error deleting Clerk user:', error);

      // If the user does not exist in Clerk, treat as already deleted
      const status = error?.status;
      const firstErrorCode =
        Array.isArray(error?.errors) && error.errors.length > 0
          ? error.errors[0].code
          : undefined;

      if (status === 404 || firstErrorCode === 'resource_not_found') {
        return;
      }

      throw new Error(`Failed to delete Clerk user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Lock a user in Clerk (prevents login)
   * @param clerkId The Clerk user ID
   */
  async lockUser(clerkId: string): Promise<void> {
    try {
      await this.client.users.updateUser(clerkId, {
        publicMetadata: {
          locked: true,
        },
      });
      // Use the lock endpoint directly via REST API
      const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}/lock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message || 'Failed to lock user in Clerk');
      }
    } catch (error: any) {
      console.error('Error locking Clerk user:', error);

      // If the user does not exist in Clerk, treat as already locked/irrelevant
      const status = error?.status;
      const firstErrorCode =
        Array.isArray(error?.errors) && error.errors.length > 0
          ? error.errors[0].code
          : undefined;

      if (status === 404 || firstErrorCode === 'resource_not_found') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to lock Clerk user: ${errorMessage}`);
    }
  }

  /**
   * Unlock a user in Clerk (allows login)
   * @param clerkId The Clerk user ID
   */
  async unlockUser(clerkId: string): Promise<void> {
    try {
      // Use the unlock endpoint directly via REST API
      const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}/unlock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message || 'Failed to unlock user in Clerk');
      }
    } catch (error: unknown) {
      console.error('Error unlocking Clerk user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to unlock Clerk user: ${errorMessage}`);
    }
  }

  /**
   * Get a user from Clerk by ID
   * @param clerkId The Clerk user ID
   */
  async getUser(clerkId: string) {
    try {
      return await this.client.users.getUser(clerkId);
    } catch (error: any) {
      console.error('Error getting Clerk user:', error);
      throw new Error(`Failed to get Clerk user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Update a user's password in Clerk
   * @param clerkId The Clerk user ID
   * @param password The new password
   * @throws Error with Clerk error message if password update fails
   */
  async updateUserPassword(clerkId: string, password: string): Promise<void> {
    try {
      await this.client.users.updateUser(clerkId, {
        password: password,
      });
      console.log(`✅ Password updated for Clerk user ${clerkId}`);
    } catch (error: unknown) {
      console.error('Error updating password in Clerk:', error);
      
      // Extract detailed error message from Clerk API error
      let errorMessage = 'Failed to update password';
      let statusCode = 500;
      
      // Check if it's a Clerk API response error
      if (error && typeof error === 'object') {
        // Get status code first (Clerk errors have status property)
        if ('status' in error && typeof (error as any).status === 'number') {
          statusCode = (error as any).status;
        }
        
        // Extract error message from errors array (Clerk's error structure)
        if ('errors' in error && Array.isArray((error as any).errors) && (error as any).errors.length > 0) {
          const clerkErrors = (error as any).errors;
          const firstError = clerkErrors[0];
          
          // Get the most descriptive error message (longMessage is more detailed)
          errorMessage = firstError.longMessage || firstError.message || errorMessage;
          
          // For known error codes, use the longMessage or a specific message
          // The longMessage from Clerk is already user-friendly
        } else if ('message' in error && typeof (error as any).message === 'string') {
          // Fallback to message property if errors array is not available
          errorMessage = (error as any).message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        // Check if it's a Clerk API error with status
        if ('status' in error && typeof (error as any).status === 'number') {
          statusCode = (error as any).status;
        }
      }
      
      // Create error with status code info
      const customError = new Error(errorMessage);
      (customError as any).statusCode = statusCode;
      throw customError;
    }
  }
}

// Export singleton instance
export const clerkService = new ClerkService();

