import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store";
import { resetPasswordThunk } from "@/store/authSlice";
import { clearError } from "@/store/authSlice";
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from "@/utils/validationSchemas";

export const useResetPassword = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { resetPassword: isLoading },
    error: { resetPassword: serverError },
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await dispatch(
        resetPasswordThunk({
          newPassword: data.newPassword,
        })
      ).unwrap();
      router.push("/password-reset-success");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError("resetPassword"));
    };
  }, [dispatch]);

  return { register, handleSubmit, errors, onSubmit, isLoading, serverError };
};
