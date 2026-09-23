'use client'

import { useEffect, useState } from 'react'

import { navigation } from '@/modules/landing/landing.constants'

export function useSiteHeader() {
    const [activeId, setActiveId] = useState('')
    const [isCondensed, setIsCondensed] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsCondensed(window.scrollY > 32)

        handleScroll()
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)

                if (visible.length > 0) setActiveId(visible[0].target.id)
            },
            { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
        )

        navigation.forEach(entry => {
            const section = document.getElementById(entry.id)
            if (section) observer.observe(section)
        })

        return () => observer.disconnect()
    }, [])

    return { activeId, isCondensed, entries: navigation }
}
