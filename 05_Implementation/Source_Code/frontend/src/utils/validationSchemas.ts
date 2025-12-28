import * as z from "zod";
import { Gender } from "@/types/auth";

// Password validation regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Username validation regex: 3-20 chars, alphanumeric and underscores
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

// Email validation regex (basic email format)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Signup validation schema matching backend rules
export const signupSchema = z
  .object({
    profileName: z
      .string()
      .min(2, "Profile name must be at least 2 characters")
      .max(50, "Profile name must be at most 50 characters")
      .regex(
        /^[a-zA-Z\s]+$/,
        "Profile name must contain only letters and spaces"
      )
      .nonempty("Profile name is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        usernameRegex,
        "Username must contain only alphanumeric characters and underscores"
      )
      .nonempty("Username is required"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .nonempty("Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(
        passwordRegex,
        "Password must include one uppercase, one lowercase, one number, and one special character"
      )
      .nonempty("Password is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
    gender: z
      .enum([Gender.MALE, Gender.FEMALE, Gender.OTHER])
      .refine((val) => val !== undefined, {
        message: "Gender is required",
      }),
    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .refine(
        (val) => {
          const dob = new Date(val);
          const minAge = 13;
          const age = new Date().getFullYear() - dob.getFullYear();
          return age >= minAge;
        },
        { message: "You must be at least 13 years old" }
      )
      .refine((val) => new Date(val) <= new Date(), {
        message: "Date of birth cannot be in the future",
      }),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

// Login validation schema matching backend rules
export const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .nonempty("Username or email is required")
    .refine(
      (value) => usernameRegex.test(value) || emailRegex.test(value),
      "Invalid username or email format"
    ),
  password: z
    .string()
    .nonempty("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      passwordRegex,
      "Password must include one uppercase, one lowercase, one number, and one special character"
    ),
});

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .nonempty("Email is required"),
});

// Verify code validation schema
export const verifyCodeSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .nonempty("Email is required"),
  code: z
    .string()
    .length(4, "Code must be exactly 4 digits")
    .regex(/^\d{4}$/, "Code must contain only digits"),
});

// Reset password validation schema
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(
        passwordRegex,
        "Password must include one uppercase, one lowercase, one number, and one special character"
      )
      .nonempty("Password is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .superRefine(({ confirmPassword, newPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

// Post creation validation schema
export const createPostSchema = z
  .object({
    content: z
      .string()
      .max(2000, "Post content must be less than 2000 characters")
      .optional(),
    media: z
      .instanceof(File)
      .refine(
        (file) => {
          if (!file) return true; // Media is optional
          const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
          return allowedTypes.includes(file.type);
        },
        { message: "Invalid media type. Only JPEG, PNG, and MP4 are allowed" }
      )
      .refine(
        (file) => {
          if (!file) return true; // Media is optional
          const maxSize = 50 * 1024 * 1024; // 50MB
          return file.size <= maxSize;
        },
        { message: "Media file too large. Maximum size is 50MB" }
      )
      .optional(),
  })
  .refine((data) => data.content || data.media, {
    message: "Either content or media is required",
    path: ["content"],
  });

// Post update validation schema
export const updatePostSchema = z.object({
  content: z
    .string()
    .max(2000, "Post content must be less than 2000 characters")
    .optional(),
});

// Comment creation validation schema
export const addCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content must be at least 1 character")
    .max(1000, "Comment content must be less than 1000 characters")
    .nonempty("Comment content is required"),
});

// Comment reply validation schema
export const replyCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Reply content must be at least 1 character")
    .max(1000, "Reply content must be less than 1000 characters")
    .nonempty("Reply content is required"),
});

// Report post validation schema
export const reportPostSchema = z.object({
  reason: z
    .enum(["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"])
    .refine((val) => val !== undefined, {
      message: "Report reason is required",
    }),
});

// Share post validation schema
export const sharePostSchema = z.object({
  caption: z
    .string()
    .max(2000, "Caption must be less than 2000 characters")
    .optional(),
});

// Update profile validation schema
export const updateProfileSchema = z.object({
  username: z
    .string()
    .nonempty("Username is required")
    .refine(
      (val) => !val || (val.length >= 3 && val.length <= 20),
      { message: "Username must be between 3 and 20 characters" }
    )
    .refine(
      (val) => !val || usernameRegex.test(val),
      { message: "Username must contain only alphanumeric characters and underscores" }
    ),
  email: z
    .string()
    .nonempty("Email is required")
    .refine(
      (val) => !val || emailRegex.test(val),
      { message: "Please enter a valid email address" }
    ),
  bio: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 150,
      { message: "Bio must be less than 150 characters" }
    ),
  address: z.string().optional(),
  jobTitle: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: "Invalid date format. Use YYYY-MM-DD" }
    ),
  isPrivate: z
    .boolean()
    .optional(),
  firstName: z
    .string()
    .nonempty("First name is required")
    .refine(
      (val) => !val || (val.length >= 2 && val.length <= 50),
      { message: "First name must be between 2 and 50 characters" }
    )
    .refine(
      (val) => !val || /^[a-zA-Z\s]+$/.test(val),
      { message: "First name must contain only letters and spaces" }
    ),
  lastName: z
    .string()
    .nonempty("Last name is required")
    .refine(
      (val) => !val || (val.length >= 2 && val.length <= 50),
      { message: "Last name must be between 2 and 50 characters" }
    )
    .refine(
      (val) => !val || /^[a-zA-Z\s]+$/.test(val),
      { message: "Last name must contain only letters and spaces" }
    ),
  profilePicture: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => {
        if (!file) return true;
        const allowedTypes = ["image/jpeg", "image/png"];
        return allowedTypes.includes(file.type);
      },
      { message: "Profile picture must be a JPEG or PNG file" }
    )
    .refine(
      (file) => {
        if (!file) return true;
        const maxSize = 5 * 1024 * 1024; // 5MB
        return file.size <= maxSize;
      },
      { message: "Profile picture must be under 5MB" }
    ),
  coverPicture: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => {
        if (!file) return true;
        const allowedTypes = ["image/jpeg", "image/png"];
        return allowedTypes.includes(file.type);
      },
      { message: "Cover picture must be a JPEG or PNG file" }
    )
    .refine(
      (file) => {
        if (!file) return true;
        const maxSize = 10 * 1024 * 1024; // 10MB
        return file.size <= maxSize;
      },
      { message: "Cover picture must be under 10MB" }
    ),
})
.refine(
  (data) => {
    if (data.firstName || data.lastName) {
      return (data.firstName && data.lastName) || (!data.firstName && !data.lastName);
    }
    return true;
  },
  {
    message: "Both first name and last name must be provided together or neither",
    path: ["firstName", "lastName"],
  }
);

// Change password validation schema
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .nonempty("Current password is required")
      .min(8, "Old password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Old password must include one uppercase, one lowercase, one number, and one special character"
      ),
    newPassword: z
      .string()
      .nonempty("New password is required")
      .min(8, "New password must be at least 8 characters")
      .regex(
        passwordRegex,
        "New password must include one uppercase, one lowercase, one number, and one special character"
      ),
    confirmPassword: z.string().nonempty("Confirm new password is required"),
  })
  .superRefine(({ confirmPassword, newPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });



// TypeScript types inferred from schemas
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type UpdatePostFormData = z.infer<typeof updatePostSchema>;
export type AddCommentFormData = z.infer<typeof addCommentSchema>;
export type ReplyCommentFormData = z.infer<typeof replyCommentSchema>;
export type ReportPostFormData = z.infer<typeof reportPostSchema>;
export type SharePostFormData = z.infer<typeof sharePostSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;