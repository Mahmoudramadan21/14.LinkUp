import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store";
import {
  verifyCodeThunk,
  forgotPasswordThunk,
} from "@/store/authSlice";
import { clearError } from "@/store/authSlice";
import {
  verifyCodeSchema,
  VerifyCodeFormData,
} from "@/utils/validationSchemas";

const RESEND_TIMER = 60; // seconds

export const useVerifyCode = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    resetEmail,
    loading: { verifyCode: isLoading },
    error: { verifyCode: serverError },
  } = useSelector((state: RootState) => state.auth);

  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMER);

  const { handleSubmit, setValue } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { email: resetEmail || "", code },
  });

  useEffect(() => {
    setValue("code", code);
    console.log("Updated form code:", code);
  }, [code, setValue]);

  const onSubmit = async () => {
    console.log("Submitting verify code:", { email: resetEmail, code });
    if (!resetEmail || code.length !== 4) {
      console.error("Invalid input:", { email: resetEmail, code });
      return;
    }
    try {
      const response = await dispatch(
        verifyCodeThunk({ email: resetEmail, code })
      ).unwrap();
      console.log("Verify code response:", response);
      router.push("/reset-password");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error("Verify code error:");
      if (!serverError) {
        dispatch({
          type: "auth/verifyCode/rejected",
          payload: "Failed to verify code",
        });
      }
    }
  };

  const handleResend = async () => {
    if (!resetEmail) {
      console.error("No email available for resend");
      router.push("/forgot-password");
      return;
    }
    try {
      await dispatch(forgotPasswordThunk({ email: resetEmail })).unwrap();
      setTimeLeft(RESEND_TIMER);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      dispatch(clearError("verifyCode"));
    };
  }, [dispatch]);

  const isResendDisabled = timeLeft > 0 || isLoading;

  return {
    code,
    setCode,
    handleSubmit,
    onSubmit,
    isLoading,
    serverError,
    timeLeft,
    handleResend,
    isResendDisabled,
    email: resetEmail || "", // Expose email for use in the form
  };
};
