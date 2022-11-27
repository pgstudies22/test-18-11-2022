import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js'
import { getFirestore, collection, doc, getDoc, addDoc, setDoc, onSnapshot, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js'
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js'

const firebaseConfig = {
  apiKey: "AIzaSyB3g4WRjt8GfXDRzFJgA0L6ygMCxpTQsqo",
  authDomain: "test-18-11-2022-6f253.firebaseapp.com",
  projectId: "test-18-11-2022-6f253",
  storageBucket: "test-18-11-2022-6f253.appspot.com",
  messagingSenderId: "471496356849",
  appId: "1:471496356849:web:2d85c85ebd1fa201f2ca50"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const collectionPhrases = collection(db, 'phrases')

const addPhrase = async (e, user) => {
  e.preventDefault()

  try {
    await addDoc(collectionPhrases, {
      movieTitle: DOMPurify.sanitize(e.target.title.value), 
      phrase: DOMPurify.sanitize(e.target.phrase.value),
      userId: DOMPurify.sanitize(user.uid)
    })

    e.target.reset()

    const modalAddPhrase = document.querySelector('[data-modal="add-phrase"]')
    M.Modal.getInstance(modalAddPhrase).close()
  } catch (error) {
    console.log('Problema na adição do document:', error)
  }
}

const initCollapsibles = collapsibles => M.Collapsible.init(collapsibles)

const login = async () => {
  try {
    const provider = new GoogleAuthProvider()
    signInWithRedirect(auth, provider)
  } catch (error) {
    console.log('login error:', error)
  }
}

const logout = async unsubscribe => {
  try {
    await signOut(auth)
    unsubscribe()
    console.log('usuário foi deslogado')
  } catch (error) {
    console.log('logout error:', error)
  }
}

const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth)
    console.log('result:', result)
  } catch (error) {
    console.log('erro em getRedirectResult:', error)
  }
}

const renderLinks = user => {
  const lis = [...document.querySelector('[data-js="nav-ul"]').children]
  
  lis.forEach(li => {
    const liShouldBeVisible = li.dataset.js.includes(user ? 'logged-in' : 'logged-out')
    
    if (liShouldBeVisible) {
      li.classList.remove('hide')
      return
    }
  
    li.classList.add('hide')
  })
}

const handleLoginMessage = () => document
  .querySelector('[data-js="login-message"]')
  ?.remove()

const handleAnonymousUser = ({ formAddPhrase, linkLogout, buttonGoogle, phrasesList, accountDetailsContainer }) => {
  const phrasesContainer = document.querySelector('[data-js="phrases-container"]')
  const loginMessage = document.createElement('h5')

  loginMessage.textContent = 'Faça login para ver as frases'
  loginMessage.classList.add('center-align', 'white-text')
  loginMessage.setAttribute('data-js', 'login-message')
  phrasesContainer.append(loginMessage)

  formAddPhrase.removeEventListener('submit', addPhrase)
  formAddPhrase.onsubmit = null
  linkLogout.onclick = null
  buttonGoogle.addEventListener('click', login)
  phrasesList.innerHTML = ''
  accountDetailsContainer.innerHTML = ''
}

const createUserDoc = async user => {
  const userDocRef = doc(db, 'users', user.uid)
  const docSnapshot = await getDoc(userDocRef)
  
  if (docSnapshot.exists()) {
    return
  }

  try {
    await setDoc(userDocRef, {
      name: DOMPurify.sanitize(user.displayName),
      email: DOMPurify.sanitize(user.email)
    })
  } catch (error) {
    console.log('Erro ao tentar registrar usuário no collection users:', error)
  }
}

const renderPhrases = ({ user, phrasesList }) => {
  const queryPhrases = query(collectionPhrases, where('userId', '==', user.uid))
  return onSnapshot(queryPhrases, snapshot => {
    const documentFragment = document.createDocumentFragment()
    
    snapshot.docChanges().forEach(docChange => {
      const liPhrase = document.createElement('li')
      const movieTitleContainer = document.createElement('div')
      const phraseContainer = document.createElement('div')
      const { movieTitle, phrase } = docChange.doc.data()

      movieTitleContainer.textContent = DOMPurify.sanitize(movieTitle)
      phraseContainer.textContent = DOMPurify.sanitize(phrase)
      movieTitleContainer.setAttribute('class', 'collapsible-header blue-grey-text text-lighten-5 blue-grey darken-4')
      phraseContainer.setAttribute('class', 'collapsible-body blue-grey-text text-lighten-5 blue-grey darken-3')

      liPhrase.append(movieTitleContainer, phraseContainer)
      documentFragment.append(liPhrase)
    })

    phrasesList.append(documentFragment)
  })
}

const handleSignedUser = async ({ user, formAddPhrase, phrasesList, buttonGoogle, linkLogout, accountDetailsContainer, accountDetails }) => {
  createUserDoc(user)
  buttonGoogle.removeEventListener('click', login)
  formAddPhrase.onsubmit = e => addPhrase(e, user)

  const unsubscribe = renderPhrases({ user, phrasesList })
  linkLogout.onclick = () => logout(unsubscribe)
  
  initCollapsibles(phrasesList)
  accountDetails.textContent = DOMPurify.sanitize(`${user.displayName} | ${user.email}`)
  accountDetailsContainer.append(accountDetails)
}

const handleAuthStateChanged = async user => {
  handleRedirectResult()
  renderLinks(user)
  handleLoginMessage()

  const elements = {
    formAddPhrase: document.querySelector('[data-js="add-phrase-form"]'),
    phrasesList: document.querySelector('[data-js="phrases-list"]'),
    buttonGoogle: document.querySelector('[data-js="button-google"]'),
    linkLogout: document.querySelector('[data-js="logout"]'),
    accountDetailsContainer: document.querySelector('[data-js="account-details"]'),
    accountDetails: document.createElement('p')
  }

  if (!user) {
    return handleAnonymousUser(elements)
  }

  handleSignedUser({ user, ...elements })
}

const initModals = () => {
  const modals = document.querySelectorAll('[data-js="modal"]')
  M.Modal.init(modals)
}

onAuthStateChanged(auth, handleAuthStateChanged)
initModals()
