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
   * Generate a secure random password that meets Clerk's requirements
   * Clerk typically requires passwords to be at least 8 characters with various character types
   */
  private generateSecurePassword(): string {
    // Generate a password with:
    // - At least 8 characters
    // - Upper and lowercase letters
    // - Numbers
    // - Special characters
    const length = 16;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = lowercase + uppercase + numbers + special;

    // Ensure at least one character from each category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable pattern
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

      // Clerk requires a password based on instance settings
      // If no password is provided, generate a secure random one
      // Clerk will send an invitation email automatically when creating the user
      // The user will set their password through the invitation link
      if (input.password) {
        createUserPayload.password = input.password;
      } else {
        // Generate a secure random password that meets Clerk's requirements
        // This password will be temporary - the user will reset it via invitation email
        createUserPayload.password = this.generateSecurePassword();
      }

      // Ensure email verification/invitation is sent
      // Clerk automatically sends an invitation email when a user is created without email verification
      // The user will receive an email to verify their email and set their password
      createUserPayload.skipEmailVerification = false;

      const clerkUser = await this.client.users.createUser(createUserPayload);

      // Note: Clerk automatically sends an invitation email when:
      // 1. skipEmailVerification is false (default)
      // 2. User is created with an email address
      // The user will receive an email with a link to verify their email and set their password

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
   * Delete a user from Clerk
   * @param clerkId The Clerk user ID
   */
  async deleteUser(clerkId: string): Promise<void> {
    try {
      await this.client.users.deleteUser(clerkId);
    } catch (error: any) {
      console.error('Error deleting Clerk user:', error);
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
    } catch (error: unknown) {
      console.error('Error locking Clerk user:', error);
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
}

// Export singleton instance
export const clerkService = new ClerkService();

