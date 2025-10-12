import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store";
import { forgotPasswordThunk } from "@/store/authSlice";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "@/utils/validationSchemas";

export const useForgotPassword = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { forgotPassword: isLoading },
    error: { forgotPassword: serverError },
    resetCodeSent,
    resetEmail,
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await dispatch(forgotPasswordThunk(data)).unwrap();
      // Redirect is handled in useEffect below
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    if (resetCodeSent && resetEmail) {
      router.push("/verify-code");
    }
  }, [resetCodeSent, resetEmail, router]);

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isLoading,
    serverError,
    resetCodeSent,
  };
};
