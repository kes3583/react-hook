import * as React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useLatest from '@react-hook/latest'

/**
 * A React hook that fires a callback whenever ResizeObserver detects a change to its size
 *
 * @param target A React ref created by `useRef()` or an HTML element
 * @param callback Invoked with a single `ResizeObserverEntry` any time
 *   the `target` resizes
 */
function useResizeObserver<T extends HTMLElement>(
  target: React.RefObject<T> | T | null,
  callback: UseResizeObserverCallback
): ResizeObserver {
  const resizeObserver = getResizeObserver()
  const storedCallback = useLatest(callback)

  useLayoutEffect(() => {
    let didUnsubscribe = false
    const targetEl = target && 'current' in target ? target.current : target
    if (!targetEl) return

    resizeObserver.subscribe(
      targetEl,
      (entry: ResizeObserverEntry, observer: ResizeObserver) => {
        if (didUnsubscribe) return
        storedCallback.current(entry, observer)
      }
    )

    return () => {
      didUnsubscribe = true
      resizeObserver.unsubscribe(targetEl)
    }
  }, [target, resizeObserver, storedCallback])

  useLayoutEffect(() => {
    const targetEl = target && 'current' in target ? target.current : target
    if (!targetEl) return
    resizeObserver.observer.observe(targetEl)
    return () => resizeObserver.observer.unobserve(targetEl)
  }, [target, resizeObserver.observer])

  return resizeObserver.observer
}

function createResizeObserver() {
  const callbacks: Map<any, UseResizeObserverCallback> = new Map()

  return {
    observer: new ResizeObserver((entries, observer) => {
      if (entries.length === 1) {
        callbacks.get(entries[0].target)?.(entries[0], observer)
      } else {
        for (let i = 0; i < entries.length; i++) {
          callbacks.get(entries[i].target)?.(entries[i], observer)
        }
      }
    }),
    subscribe: (target: HTMLElement, callback: UseResizeObserverCallback) =>
      callbacks.set(target, callback),
    unsubscribe: (target: HTMLElement) => callbacks.delete(target),
  }
}

let _resizeObserver: ReturnType<typeof createResizeObserver>

const getResizeObserver = () =>
  !_resizeObserver
    ? (_resizeObserver = createResizeObserver())
    : _resizeObserver

export type UseResizeObserverCallback = (
  entry: ResizeObserverEntry,
  observer: ResizeObserver
) => any

export default useResizeObserver
