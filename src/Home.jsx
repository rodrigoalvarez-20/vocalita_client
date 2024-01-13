import { useEffect, useRef, useState } from "react";
import { Button, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
//import { LineChart } from "react-native-chart-kit";
import { Chart, Line, Area, HorizontalAxis, VerticalAxis } from 'react-native-responsive-linechart'


const Home = () => {
	const [recordData, setRecordData] = useState(null);
	const recordingIndicator = useRef(null);
	const [selectedUri, setSelectedUri] = useState(null);
	const [selectedFileName, setSelectedFileName] = useState("");
	const [loadedSound, setLoadedSound] = useState(undefined);
	const [isProcessingSound, setIsProcessingSound] = useState(false);
	const [ fftData, setFftData ] = useState({});

	useEffect(() => {
		(async () => {
			await Audio.requestPermissionsAsync();
		})();
	}, []);

	useEffect(() => {
		return loadedSound
			? () => {
					console.log("Unloading Sound");
					loadedSound.unloadAsync();
			  }
			: undefined;
	}, [loadedSound]);


	const handleStartRecording = async () => {
		recordingIndicator.current?.play();
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			console.log("Starting recording..");
			const { recording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY
			);
			setRecordData(recording);
			console.log("Recording started");
		} catch (err) {
			console.error("Failed to start recording", err);
		}
	};

	const handleEndRecording = async () => {
		recordingIndicator.current?.pause();
		recordingIndicator.current?.reset();
		setRecordData(undefined);
		await recordData.stopAndUnloadAsync();
		await Audio.setAudioModeAsync({
			allowsRecordingIOS: false,
		});
		const uri = recordData.getURI();
		console.log("Recording stopped and stored at", uri);
		setSelectedUri(uri);
		setSelectedFileName(uri.split("/")[uri.split("/").length - 1]);
	};

	const playSound = async () => {
		console.log("Loading Sound");
		await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
		const { sound: playbackObject } = await Audio.Sound.createAsync(
			{ uri: selectedUri },
			{ shouldPlay: true }
		);
		console.log("Playing Sound");
		await playbackObject.playAsync();
	};

	const select_file = async () => {
		const audio_file = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true })
		if (audio_file.canceled){
			Alert.alert( "Advertencia", "No se ha seleccionado ningun archivo");
			return
		}
		
		const data = audio_file.assets[0];

		if (data.uri){
			setSelectedUri(data.uri)
			setSelectedFileName( data.name.split("/")[data.name.split("/").length - 1] )
		}

	}

	const process_audio_file = async () => {
		try {

			setIsProcessingSound(true);
			// Enviar archivo m4
			const API_URL = process.env.EXPO_PUBLIC_API_URL;

			const mimeType = selectedFileName.split(".").pop()
			
			let file = new FormData();
			
			file.append("file", {
				uri: selectedUri,
				name: selectedFileName,
				type: `audio/x-${mimeType}`,
			});

			const request_data = await axios.post(API_URL + "/process_file", file, {
				headers: { "Content-Type": "multipart/form-data" }
			});


			if (request_data.status !== 200){
				Alert.alert("Error", "Ha ocurrido un error al obtener los datos desde servidor");
				return
			}

			setFftData(request_data.data)
			setIsProcessingSound(false);
		} catch (ex) {
			Alert.alert("Ha ocurrido un error al procesar el archivo de audio");
			console.log(ex.toString());
			setIsProcessingSound(false);
		}
	};

	function render_playback_controls() {
		return (
			<View
				style={{
					flexDirection: "column",
					margin: 0,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Text style={{ fontSize: 20, margin: 8 }}>Archivo seleccionado</Text>
				<Text
					style={{
						fontSize: 16,
						marginTop: 8,
						marginBottom: 8,
						marginStart: 12,
						marginEnd: 12,
						flexWrap: "wrap",
					}}
				>
					{selectedFileName}
				</Text>
				<View style={{ margin: 8, flexDirection: "row", height: 52, justifyContent:"center", alignItems: "center" }}>
					<View style={{ flex: 1 }}>
						<Button title="Reproducir" color="#856088" onPress={playSound} />
					</View>
					<View style={{ flex: 1 }}>
						{isProcessingSound ? (
							<ActivityIndicator size="large" />
						) : (
							<Button
								title="Procesar archivo"
								color="#C51E3A"
								onPress={process_audio_file}
							/>
						)}
					</View>
				</View>
			</View>
		);
	}

	function render_fft_data() {
		return (
			<View
				style={{
					marginStart: 24,
					marginEnd: 24,
					width: "100%",
					padding: 8,
					borderRadius: 12,
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<View>
					<Text style={{ fontSize: 18 }}>
						Clase obtenida: {fftData["class"]}
					</Text>
				</View>
				<View style={{ width: "80%" }}>
					<Text style={{ marginTop: 8, fontSize: 16 }}>Gráfica de audio enviado</Text>
					<View>
						<Chart
							style={{ height: 200 }}
							data={fftData["audio_data"]}
							padding={{ left: 40, bottom: 20, right: 20, top: 20 }}
							xDomain={{ min: 0, max: fftData["max_xdata"] }}
							yDomain={{ min: fftData["min_ydata"], max: fftData["max_ydata"] }}
						>
							<VerticalAxis tickCount={10} theme={{ labels: { formatter: (v) => v.toFixed(2) } }} />
							<HorizontalAxis tickCount={5} />
							<Line />
						</Chart>
					</View>
					
				</View>
				<View>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={{ flexDirection: "column", marginTop: 8 }}>
				<View style={{ marginTop: 24 }}>
					<Text style={{ fontSize: 20 }}>Selecciona un audio para iniciar</Text>
				</View>
				<View
					style={{
						marginTop: 12,
						flexDirection: "row",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<View style={{ flex: 2 }}>
						<Pressable
							onLongPress={handleStartRecording}
							onPressOut={handleEndRecording}
							delayLongPress={500}
							style={{
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<LottieView
								ref={recordingIndicator}
								source={require("./assets/mic_animation.json")}
								style={{ width: 180 }}
								loop
							/>
						</Pressable>
					</View>
					<View style={{ flex: 1, display: "flex" }}>
						<Button title="Abrir archivo" onPress={select_file} />
					</View>
				</View>
			</View>
			{selectedUri ? render_playback_controls() : undefined}
			{ Object.keys(fftData).length > 0 ? render_fft_data() : undefined}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
		alignItems: "center",
		padding: 12
	},
	selectorContainer: {},
});

export default Home;
