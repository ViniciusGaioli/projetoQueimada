'use client'

import { useCallback, useMemo, useState } from 'react'

import { dataVariables } from '@/modules/landing/landing.constants'

export function useDataSchema() {
    const [activeField, setActiveField] = useState(dataVariables[0].field)

    const activeVariable = useMemo(
        () => dataVariables.find(item => item.field === activeField) ?? dataVariables[0],
        [activeField],
    )

    const handleSelectField = useCallback((field: string) => setActiveField(field), [])

    return {
        activeField: activeVariable.field,
        activeVariable,
        handleSelectField,
        variables: dataVariables,
    }
}
