import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store";
import { loginThunk } from "@/store/authSlice";
import { clearError } from "@/store/authSlice";
import { loginSchema } from "@/utils/validationSchemas";

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { login: isLoading },
    error: { login: serverError },
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(loginThunk(data)).unwrap();
      router.replace("/feed");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError("login"));
    };
  }, [dispatch]);

  return { register, handleSubmit, errors, onSubmit, isLoading, serverError };
};
