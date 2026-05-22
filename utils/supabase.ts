import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })
// npm install @supabase/supabase-js
// npx skills add supabase/agent-skills


// example usage in a React Native component
// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList } from 'react-native';
// import { supabase } from '../utils/supabase';

// export default function App() {
//   const [todos, setTodos] = useState([]);

//   useEffect(() => {
//     const getTodos = async () => {
//       try {
//         const { data: todos, error } = await supabase.from('todos').select();

//         if (error) {
//           console.error('Error fetching todos:', error.message);
//           return;
//         }

//         if (todos && todos.length > 0) {
//           setTodos(todos);
//         }
//       } catch (error) {
//         console.error('Error fetching todos:', error.message);
//       }
//     };

//     getTodos();
//   }, []);

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Todo List</Text>
//       <FlatList
//         data={todos}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => <Text key={item.id}>{item.name}</Text>}
//       />
//     </View>
//   );
// };