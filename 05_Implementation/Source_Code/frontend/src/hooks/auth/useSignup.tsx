import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store";
import { signupThunk } from "@/store/authSlice";
import { clearError } from "@/store/authSlice";
import { signupSchema, SignupFormData } from "@/utils/validationSchemas";
import { SignupRequest } from "@/types/auth";

export const useSignup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { signup: isLoading },
    error: { signup: serverError },
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    const signupData: SignupRequest = {
      profileName: data.profileName,
      username: data.username,
      email: data.email,
      password: data.password,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
    };
    try {
      await dispatch(signupThunk(signupData)).unwrap();
      router.push("/");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError("signup"));
    };
  }, [dispatch]);

  return { register, handleSubmit, errors, onSubmit, isLoading, serverError };
};
