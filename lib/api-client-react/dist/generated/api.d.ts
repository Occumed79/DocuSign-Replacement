import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { Answer, AuthResponse, Case, CaseReview, CreateCaseBody, CreateQuestionBody, DashboardStats, ErrorResponse, ExamType, HealthStatus, ListCasesParams, ListQuestionsParams, LoginBody, MessageResponse, Question, UpdateCaseBody, UpdateQuestionBody, UpsertAnswersBody, User } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Login with email and password
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginBody: LoginBody, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginBody>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login with email and password
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
/**
 * @summary Logout current user
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<MessageResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout current user
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current authenticated user
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current authenticated user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all exam types
 */
export declare const getListExamTypesUrl: () => string;
export declare const listExamTypes: (options?: RequestInit) => Promise<ExamType[]>;
export declare const getListExamTypesQueryKey: () => readonly ["/api/exam-types"];
export declare const getListExamTypesQueryOptions: <TData = Awaited<ReturnType<typeof listExamTypes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listExamTypes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listExamTypes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListExamTypesQueryResult = NonNullable<Awaited<ReturnType<typeof listExamTypes>>>;
export type ListExamTypesQueryError = ErrorType<unknown>;
/**
 * @summary List all exam types
 */
export declare function useListExamTypes<TData = Awaited<ReturnType<typeof listExamTypes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listExamTypes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all cases
 */
export declare const getListCasesUrl: (params?: ListCasesParams) => string;
export declare const listCases: (params?: ListCasesParams, options?: RequestInit) => Promise<Case[]>;
export declare const getListCasesQueryKey: (params?: ListCasesParams) => readonly ["/api/cases", ...ListCasesParams[]];
export declare const getListCasesQueryOptions: <TData = Awaited<ReturnType<typeof listCases>>, TError = ErrorType<unknown>>(params?: ListCasesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCases>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCasesQueryResult = NonNullable<Awaited<ReturnType<typeof listCases>>>;
export type ListCasesQueryError = ErrorType<unknown>;
/**
 * @summary List all cases
 */
export declare function useListCases<TData = Awaited<ReturnType<typeof listCases>>, TError = ErrorType<unknown>>(params?: ListCasesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new case
 */
export declare const getCreateCaseUrl: () => string;
export declare const createCase: (createCaseBody: CreateCaseBody, options?: RequestInit) => Promise<Case>;
export declare const getCreateCaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCase>>, TError, {
        data: BodyType<CreateCaseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCase>>, TError, {
    data: BodyType<CreateCaseBody>;
}, TContext>;
export type CreateCaseMutationResult = NonNullable<Awaited<ReturnType<typeof createCase>>>;
export type CreateCaseMutationBody = BodyType<CreateCaseBody>;
export type CreateCaseMutationError = ErrorType<unknown>;
/**
 * @summary Create a new case
 */
export declare const useCreateCase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCase>>, TError, {
        data: BodyType<CreateCaseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCase>>, TError, {
    data: BodyType<CreateCaseBody>;
}, TContext>;
/**
 * @summary Get a case by ID
 */
export declare const getGetCaseUrl: (id: number) => string;
export declare const getCase: (id: number, options?: RequestInit) => Promise<Case>;
export declare const getGetCaseQueryKey: (id: number) => readonly [`/api/cases/${number}`];
export declare const getGetCaseQueryOptions: <TData = Awaited<ReturnType<typeof getCase>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCase>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCaseQueryResult = NonNullable<Awaited<ReturnType<typeof getCase>>>;
export type GetCaseQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a case by ID
 */
export declare function useGetCase<TData = Awaited<ReturnType<typeof getCase>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a case
 */
export declare const getUpdateCaseUrl: (id: number) => string;
export declare const updateCase: (id: number, updateCaseBody: UpdateCaseBody, options?: RequestInit) => Promise<Case>;
export declare const getUpdateCaseMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCase>>, TError, {
        id: number;
        data: BodyType<UpdateCaseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCase>>, TError, {
    id: number;
    data: BodyType<UpdateCaseBody>;
}, TContext>;
export type UpdateCaseMutationResult = NonNullable<Awaited<ReturnType<typeof updateCase>>>;
export type UpdateCaseMutationBody = BodyType<UpdateCaseBody>;
export type UpdateCaseMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a case
 */
export declare const useUpdateCase: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCase>>, TError, {
        id: number;
        data: BodyType<UpdateCaseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCase>>, TError, {
    id: number;
    data: BodyType<UpdateCaseBody>;
}, TContext>;
/**
 * @summary Delete a case
 */
export declare const getDeleteCaseUrl: (id: number) => string;
export declare const deleteCase: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCase>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCase>>, TError, {
    id: number;
}, TContext>;
export type DeleteCaseMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCase>>>;
export type DeleteCaseMutationError = ErrorType<unknown>;
/**
 * @summary Delete a case
 */
export declare const useDeleteCase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCase>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCase>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get all answers for a case
 */
export declare const getGetCaseAnswersUrl: (id: number) => string;
export declare const getCaseAnswers: (id: number, options?: RequestInit) => Promise<Answer[]>;
export declare const getGetCaseAnswersQueryKey: (id: number) => readonly [`/api/cases/${number}/answers`];
export declare const getGetCaseAnswersQueryOptions: <TData = Awaited<ReturnType<typeof getCaseAnswers>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCaseAnswers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCaseAnswers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCaseAnswersQueryResult = NonNullable<Awaited<ReturnType<typeof getCaseAnswers>>>;
export type GetCaseAnswersQueryError = ErrorType<unknown>;
/**
 * @summary Get all answers for a case
 */
export declare function useGetCaseAnswers<TData = Awaited<ReturnType<typeof getCaseAnswers>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCaseAnswers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Bulk upsert answers for a case
 */
export declare const getUpsertCaseAnswersUrl: (id: number) => string;
export declare const upsertCaseAnswers: (id: number, upsertAnswersBody: UpsertAnswersBody, options?: RequestInit) => Promise<Answer[]>;
export declare const getUpsertCaseAnswersMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof upsertCaseAnswers>>, TError, {
        id: number;
        data: BodyType<UpsertAnswersBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof upsertCaseAnswers>>, TError, {
    id: number;
    data: BodyType<UpsertAnswersBody>;
}, TContext>;
export type UpsertCaseAnswersMutationResult = NonNullable<Awaited<ReturnType<typeof upsertCaseAnswers>>>;
export type UpsertCaseAnswersMutationBody = BodyType<UpsertAnswersBody>;
export type UpsertCaseAnswersMutationError = ErrorType<unknown>;
/**
 * @summary Bulk upsert answers for a case
 */
export declare const useUpsertCaseAnswers: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof upsertCaseAnswers>>, TError, {
        id: number;
        data: BodyType<UpsertAnswersBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof upsertCaseAnswers>>, TError, {
    id: number;
    data: BodyType<UpsertAnswersBody>;
}, TContext>;
/**
 * @summary Get completeness review for a case
 */
export declare const getGetCaseReviewUrl: (id: number) => string;
export declare const getCaseReview: (id: number, options?: RequestInit) => Promise<CaseReview>;
export declare const getGetCaseReviewQueryKey: (id: number) => readonly [`/api/cases/${number}/review`];
export declare const getGetCaseReviewQueryOptions: <TData = Awaited<ReturnType<typeof getCaseReview>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCaseReview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCaseReview>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCaseReviewQueryResult = NonNullable<Awaited<ReturnType<typeof getCaseReview>>>;
export type GetCaseReviewQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get completeness review for a case
 */
export declare function useGetCaseReview<TData = Awaited<ReturnType<typeof getCaseReview>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCaseReview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List questions, optionally filtered by exam type
 */
export declare const getListQuestionsUrl: (params?: ListQuestionsParams) => string;
export declare const listQuestions: (params?: ListQuestionsParams, options?: RequestInit) => Promise<Question[]>;
export declare const getListQuestionsQueryKey: (params?: ListQuestionsParams) => readonly ["/api/questions", ...ListQuestionsParams[]];
export declare const getListQuestionsQueryOptions: <TData = Awaited<ReturnType<typeof listQuestions>>, TError = ErrorType<unknown>>(params?: ListQuestionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listQuestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listQuestions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListQuestionsQueryResult = NonNullable<Awaited<ReturnType<typeof listQuestions>>>;
export type ListQuestionsQueryError = ErrorType<unknown>;
/**
 * @summary List questions, optionally filtered by exam type
 */
export declare function useListQuestions<TData = Awaited<ReturnType<typeof listQuestions>>, TError = ErrorType<unknown>>(params?: ListQuestionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listQuestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new question template
 */
export declare const getCreateQuestionUrl: () => string;
export declare const createQuestion: (createQuestionBody: CreateQuestionBody, options?: RequestInit) => Promise<Question>;
export declare const getCreateQuestionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createQuestion>>, TError, {
        data: BodyType<CreateQuestionBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createQuestion>>, TError, {
    data: BodyType<CreateQuestionBody>;
}, TContext>;
export type CreateQuestionMutationResult = NonNullable<Awaited<ReturnType<typeof createQuestion>>>;
export type CreateQuestionMutationBody = BodyType<CreateQuestionBody>;
export type CreateQuestionMutationError = ErrorType<unknown>;
/**
 * @summary Create a new question template
 */
export declare const useCreateQuestion: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createQuestion>>, TError, {
        data: BodyType<CreateQuestionBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createQuestion>>, TError, {
    data: BodyType<CreateQuestionBody>;
}, TContext>;
/**
 * @summary Update a question template
 */
export declare const getUpdateQuestionUrl: (id: number) => string;
export declare const updateQuestion: (id: number, updateQuestionBody: UpdateQuestionBody, options?: RequestInit) => Promise<Question>;
export declare const getUpdateQuestionMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateQuestion>>, TError, {
        id: number;
        data: BodyType<UpdateQuestionBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateQuestion>>, TError, {
    id: number;
    data: BodyType<UpdateQuestionBody>;
}, TContext>;
export type UpdateQuestionMutationResult = NonNullable<Awaited<ReturnType<typeof updateQuestion>>>;
export type UpdateQuestionMutationBody = BodyType<UpdateQuestionBody>;
export type UpdateQuestionMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a question template
 */
export declare const useUpdateQuestion: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateQuestion>>, TError, {
        id: number;
        data: BodyType<UpdateQuestionBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateQuestion>>, TError, {
    id: number;
    data: BodyType<UpdateQuestionBody>;
}, TContext>;
/**
 * @summary Delete a question template
 */
export declare const getDeleteQuestionUrl: (id: number) => string;
export declare const deleteQuestion: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteQuestionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteQuestion>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteQuestion>>, TError, {
    id: number;
}, TContext>;
export type DeleteQuestionMutationResult = NonNullable<Awaited<ReturnType<typeof deleteQuestion>>>;
export type DeleteQuestionMutationError = ErrorType<unknown>;
/**
 * @summary Delete a question template
 */
export declare const useDeleteQuestion: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteQuestion>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteQuestion>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get dashboard statistics
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboard/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map