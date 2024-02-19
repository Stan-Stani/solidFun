import {
  createSignal,
  type Component,
  onMount,
  ErrorBoundary,
  Index,
  Ref,
  createEffect,
  onCleanup,
} from 'solid-js'

import styles from './App.module.css'
import Shelf from './components/shelf'

import responseCodes from './assets/responseCodes.json'
const responseCodesJson = JSON.stringify(responseCodes)

interface responseCode {
  code: string
  phrase: string
  description: string
  spec_title: string
  spec_href: string
}

type choicesArr = [responseCode, responseCode, responseCode, responseCode]

enum quizStateEnum {
  initialSelection,
  correct,
  wrong
}

const App: Component = () => {
  /** Should be immutable */
  const [codeInfoArr, setCodeInfoArr] = createSignal<responseCode[] | null>(
    null
  )
  const [questionChoices, setQuestionChoices] = createSignal<choicesArr | []>(
    []
  )
  const [correctAnswer, setCorrectAnswer] = createSignal<responseCode | null>(
    null
  )
  const [currentChoice, setCurrentChoice] = createSignal('')
  const [result, setResult] = createSignal('')
  const getNewCodeInfoArr = async () => {
    return (await JSON.parse(responseCodesJson)) as responseCode[]
  }
  const [quizState, setQuizState] = createSignal(quizStateEnum.initialSelection)

  const getNewIndex = (arr: Array<responseCode>) => {
    return Math.floor(Math.random() * (arr.length ?? 0))
  }
  const applyQuestionChoices = async () => {
    let mutableCodeInfoArr = await getNewCodeInfoArr()
    const arrToBuild = []
    for (let i = 1; i < 5; i++) {
      const codeIndex = getNewIndex(mutableCodeInfoArr)
      const codeInfoObj = mutableCodeInfoArr[codeIndex]
      mutableCodeInfoArr = mutableCodeInfoArr.filter(
        (_, index) => index !== codeIndex
      )
      arrToBuild.push(codeInfoObj)
    }
    setQuestionChoices(arrToBuild as choicesArr)
    console.log(arrToBuild)
  }
  const chooseCorrectAnswer = () => {
    console.log(questionChoices().length, 'length')
    const correctAnswer =
      questionChoices()?.[Math.floor(Math.random() * questionChoices().length)]
    setCorrectAnswer(correctAnswer ?? null)
  }
  const applyNewQuestion = async () => {
    if (fieldSet) {
      // This is the only way I can figure out to clear the checked
      // status of the radio buttons without recreating the DOM nodes
      const inputs = fieldSet.getElementsByTagName('input')
      Array.from(inputs).forEach((el) => {
        el.checked = false
      })
    }
    await applyQuestionChoices()
    chooseCorrectAnswer()
    setCurrentChoice('')
    setQuizState(quizStateEnum.initialSelection)
  }
  const applyResult = () => {
    if (correctAnswer()?.code === currentChoice()) {
      setQuizState(quizStateEnum.correct)
    } else {
      setQuizState(quizStateEnum.wrong)
    }
  }

  onMount(async () => {
    setCodeInfoArr(await getNewCodeInfoArr())
    /**@todo Don't let next code be same*/
    // applyNewResponseCode()
    await applyNewQuestion()
  })

  createEffect(() => {
    const currentQuizState = quizState()
    console.log(currentQuizState)
    console.log(styles.fadeIn)
    if (currentQuizState !== quizStateEnum.initialSelection && resultElement) {
      const timeoutId = setTimeout(() => {
        resultElement?.classList.remove(styles.fadeIn)
      }, 500)
      onCleanup(() => clearTimeout(timeoutId))
    }
  })

  let fieldSet: HTMLFieldSetElement | undefined
  let resultElement: HTMLHeadingElement | undefined

  return (
    <ErrorBoundary fallback={(err) => err}>
      <div class={styles.App}>
        <header class={styles.header}>
          <h1>HTTP Response Code Quiz</h1>
        </header>
        <main>
          <h2 class={styles.description}>
            Code Description: {correctAnswer()?.description}
          </h2>

          <fieldset ref={(el) => (fieldSet = el)}>
            <legend>Choose a code:</legend>

            <Index each={questionChoices()}>
              {(choice, index) => (
                <div>
                  <input
                    type="radio"
                    name="choice"
                    id={choice().code}
                    value={choice().code}
                    onChange={(e) => setCurrentChoice(e.target.value)}
                  />
                  <label for={choice().code}>{choice().code}</label>
                </div>
              )}
            </Index>
          </fieldset>

          {
            <h2 ref={(el) => (resultElement = el)} class={`${styles.result} ${quizState() !== quizStateEnum.initialSelection ? `${styles.fadeIn} ${styles.opacity1}` : ''}`}>
              {quizState() === quizStateEnum.correct && 'Correct!' || quizState() === quizStateEnum.wrong && 'Try again!'}
            </h2>
          }

          <button
            onClick={() => {
              switch (quizState()) {
                case quizStateEnum.initialSelection:
                case quizStateEnum.wrong:
                  applyResult()
                  break
                case quizStateEnum.correct:
                  applyNewQuestion()
                  break
              }
              if (resultElement) {
                /** @todo Make this declarative. We're in a Reactive library! :P */
                resultElement.classList.remove(styles.fadeIn)

                const actualQuizState = quizState()
                setQuizState(quizStateEnum.initialSelection)
                setQuizState(actualQuizState)
              }
            }}
          >
            {(quizState() === quizStateEnum.correct && 'Next') || 'Confirm'}
          </button>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
