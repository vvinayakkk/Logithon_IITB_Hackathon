import { Fontisto } from '@expo/vector-icons';
import React from 'react'
import { TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Text } from 'react-native';

const PhotoPreviewSection = ({
    photo,
    handleRetakePhoto,
    handleAcceptPhoto
}) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.box}>
            <Image
                style={styles.previewConatiner}
                source={{ uri: photo.uri }} // Changed from base64 to direct uri
            />
        </View>

        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
                <Fontisto name='trash' size={36} color='black' />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.button, styles.acceptButton]} 
                onPress={() => handleAcceptPhoto(photo)} // Pass the entire photo object
            >
                <Fontisto name='check' size={36} color='white' />
                <Text style={styles.acceptButtonText}>Use Photo</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        borderRadius: 15,
        padding: 1,
        width: '95%',
        backgroundColor: 'darkgray',
        justifyContent: 'center',
        alignItems: "center",
    },
    previewConatiner: {
        width: '95%',
        height: '85%',
        borderRadius: 15
    },
    buttonContainer: {
        marginTop: '4%',
        flexDirection: 'row',
        justifyContent: "space-evenly",
        width: '100%',
    },
    button: {
        backgroundColor: 'gray',
        borderRadius: 25,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    acceptButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8
    }
});

export default PhotoPreviewSection;