'use client'

import { useState, useCallback, useMemo, createContext, useContext, useRef, useEffect } from 'react'
import { FormElementWrapper, type FormElementWrapperProps } from '@helpwave/hightide'

type ValidationTrigger = () => void
type ValidationStateGetter = () => { isValid: boolean }

const FormValidationContext = createContext<{
  registerField: (trigger: ValidationTrigger) => () => void,
  registerValidationState: (getter: ValidationStateGetter) => () => void,
  validateAll: () => void,
  isFormValid: () => boolean,
  validationVersion: number,
} | null>(null)

export const useFormValidationContext = () => {
  const context = useContext(FormValidationContext)
  return context
}

export const FormValidationProvider = ({ children }: { children: React.ReactNode }) => {
  const fieldTriggers = useRef<Set<ValidationTrigger>>(new Set())
  const validationStateGetters = useRef<Set<ValidationStateGetter>>(new Set())
  const [validationVersion, setValidationVersion] = useState(0)

  const registerField = useCallback((trigger: ValidationTrigger) => {
    fieldTriggers.current.add(trigger)
    return () => {
      fieldTriggers.current.delete(trigger)
    }
  }, [])

  const registerValidationState = useCallback((getter: ValidationStateGetter) => {
    validationStateGetters.current.add(getter)
    setValidationVersion(v => v + 1)
    return () => {
      validationStateGetters.current.delete(getter)
      setValidationVersion(v => v + 1)
    }
  }, [])

  const validateAll = useCallback(() => {
    fieldTriggers.current.forEach(trigger => trigger())
    setValidationVersion(v => v + 1)
  }, [])

  const isFormValid = useCallback(() => {
    for (const getter of validationStateGetters.current) {
      const state = getter()
      if (!state.isValid) {
        return false
      }
    }
    return true
  }, [])

  return (
    <FormValidationContext.Provider value={{ registerField, registerValidationState, validateAll, isFormValid, validationVersion }}>
      {children}
    </FormValidationContext.Provider>
  )
}

export const useFormFieldValidation = (
  value: unknown,
  required: boolean = false
) => {
  const [touched, setTouched] = useState(false)
  const validationContext = useFormValidationContext()

  const isEmpty = useMemo(() => {
    if (value === undefined || value === null) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  }, [value])

  const isValid = useMemo(() => {
    if (!required) return true
    return !isEmpty
  }, [required, isEmpty])

  const hasError = useMemo(() => {
    return required && touched && !isValid
  }, [required, touched, isValid])

  const handleBlur = useCallback(() => {
    setTouched(true)
  }, [])

  const triggerValidation = useCallback(() => {
    setTouched(true)
  }, [])

  useEffect(() => {
    if (validationContext) {
      const unregisterField = validationContext.registerField(triggerValidation)
      const getter = () => ({ isValid })
      const unregisterState = validationContext.registerValidationState(getter)
      if (validationContext.validationVersion !== undefined) {
        void validationContext.validationVersion
      }
      return () => {
        unregisterField()
        unregisterState()
      }
    }
  }, [validationContext, triggerValidation, isValid, validationContext?.validationVersion])

  const errorMessage = useMemo(() => {
    if (hasError) {
      return 'This field is required'
    }
    return undefined
  }, [hasError])

  return {
    touched,
    setTouched,
    isValid,
    hasError,
    isEmpty,
    handleBlur,
    errorMessage,
    triggerValidation,
  }
}

export type ValidatedFormElementWrapperProps = FormElementWrapperProps & {
  value?: unknown,
  required?: boolean,
}

export const ValidatedFormElementWrapper = ({
  value,
  required = false,
  children,
  error,
  ...props
}: ValidatedFormElementWrapperProps) => {
  const validation = useFormFieldValidation(value, required)

  return (
    <FormElementWrapper
      {...props}
      required={required}
      isShowingError={validation.hasError}
      onIsShowingError={(show) => {
        if (show !== false) {
          validation.setTouched(true)
        }
      }}
      error={error || validation.errorMessage}
    >
      {({ invalid, isShowingError, setIsShowingError, ...bag }) => {
        const enhancedBag = {
          ...bag,
          invalid: validation.hasError || invalid,
          isShowingError: validation.hasError || isShowingError,
          setIsShowingError: (show?: boolean) => {
            if (show !== false) {
              validation.setTouched(true)
            }
            setIsShowingError(show)
          },
        }

        if (typeof children === 'function') {
          return children(enhancedBag)
        }
        return children
      }}
    </FormElementWrapper>
  )
}

